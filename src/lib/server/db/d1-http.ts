/**
 * Minimaler Client für die Cloudflare-D1-REST-API.
 *
 * Wird zusammen mit `drizzle-orm/sqlite-proxy` benutzt: Zur Build-Zeit (Prerendering)
 * läuft der Code in Node, es gibt also keine D1-Binding – nur HTTP.
 *
 * Der Proxy-Treiber arbeitet ausschliesslich im "arrays"-Modus, deshalb geht jede
 * lesende Abfrage an `/raw` (positionsbasierte Zeilen) und nur `run` an `/query`.
 */

const API_BASE = 'https://api.cloudflare.com/client/v4';

export interface D1HttpCredentials {
	accountId: string;
	databaseId: string;
	/** API-Token mit "D1:Edit" für den Account. */
	token: string;
}

interface D1ApiError {
	code: number;
	message: string;
}

interface D1RawResults {
	columns: string[];
	rows: unknown[][];
}

interface D1ApiResponse<TResults> {
	success: boolean;
	errors: D1ApiError[];
	result: { results: TResults; success: boolean; meta: Record<string, unknown> }[];
}

/** D1 akzeptiert nur JSON-Primitive als Bind-Parameter. */
function normalizeParams(params: unknown[]): unknown[] {
	return params.map((p) => {
		if (p === undefined) return null;
		if (typeof p === 'boolean') return p ? 1 : 0;
		if (p instanceof Date) return p.getTime();
		return p;
	});
}

async function call<TResults>(
	credentials: D1HttpCredentials,
	endpoint: 'raw' | 'query',
	body: { sql: string; params?: unknown[] }
): Promise<D1ApiResponse<TResults>['result']> {
	const url = `${API_BASE}/accounts/${credentials.accountId}/d1/database/${credentials.databaseId}/${endpoint}`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${credentials.token}`
		},
		body: JSON.stringify(body)
	});

	let payload: D1ApiResponse<TResults>;
	try {
		payload = (await response.json()) as D1ApiResponse<TResults>;
	} catch {
		throw new Error(`D1 HTTP ${response.status}: Antwort war kein JSON`);
	}

	if (!response.ok || !payload.success) {
		const detail = (payload.errors ?? []).map((e) => `${e.code}: ${e.message}`).join('\n');
		throw new Error(`D1 HTTP ${response.status}${detail ? `\n${detail}` : ''}\nSQL: ${body.sql}`);
	}

	return payload.result;
}

/** Callback für `drizzle-orm/sqlite-proxy`. */
export function createRemoteCallback(credentials: D1HttpCredentials) {
	return async (sql: string, params: unknown[], method: 'run' | 'all' | 'values' | 'get') => {
		if (method === 'run') {
			await call<unknown>(credentials, 'query', { sql, params: normalizeParams(params) });
			return { rows: [] };
		}

		const result = await call<D1RawResults>(credentials, 'raw', {
			sql,
			params: normalizeParams(params)
		});
		const rows = result[0]?.results?.rows ?? [];

		// `get` erwartet genau eine Zeile (als Array), nicht eine Liste von Zeilen.
		return { rows: method === 'get' ? rows[0] : rows } as { rows: unknown[] };
	};
}

/**
 * Batch-Callback: die REST-API kennt keine parametrisierten Batches, deshalb laufen
 * die Statements nacheinander – das ist *nicht* atomar.
 */
export function createRemoteBatchCallback(credentials: D1HttpCredentials) {
	const run = createRemoteCallback(credentials);
	return async (
		queries: { sql: string; params: unknown[]; method: 'run' | 'all' | 'values' | 'get' }[]
	) => {
		const out: { rows: unknown[] }[] = [];
		for (const q of queries) out.push(await run(q.sql, q.params, q.method));
		return out;
	};
}
