/**
 * Lokale D1 für Entwicklung und lokale Builds.
 *
 * Gelesen wird genau die SQLite-Datei, die wrangler unter .wrangler/state/v3/d1
 * verwaltet – dieselbe, die `bun run db:migrate:local`, `bun run db:seed:local` und
 * `bun run db:studio:local` benutzen.
 *
 * Angebunden wird sie über denselben Treiber wie die Remote-D1
 * (`drizzle-orm/sqlite-proxy`), nur mit einem anderen Callback. Dev, lokaler Build und
 * Deploy-Build laufen damit durch identischen Code.
 *
 * Verworfene Alternativen:
 * - `@cloudflare/vite-plugin`: Bindings gibt es nur in workerd, der Prerenderer von
 *   SvelteKit läuft in Node ohne `platform`.
 * - Miniflare als Bibliothek (die Engine von `wrangler dev`): funktioniert, startet aber
 *   workerd als Kindprozess. SvelteKit beendet den Prerender-Prozess ohne `exit`-Event,
 *   die workerd-Prozesse bleiben als Waisen (PPID 1) zurück.
 *
 * Wird nur dynamisch importiert, damit `node:sqlite` nicht im Worker-Bundle landet.
 */
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const STATE_DIR = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';

const SETUP_HINT = 'Einmal `bun run db:migrate:local && bun run db:seed:local` laufen lassen.';

/**
 * Findet die lokale SQLite-Datei. wrangler benennt sie nach einem Hash, deshalb wird
 * gesucht statt fest verdrahtet – `D1_LOCAL_PATH` übersteuert.
 */
export function resolveLocalD1Path(): string {
	if (process.env.D1_LOCAL_PATH) return path.resolve(process.env.D1_LOCAL_PATH);

	const stateDir = path.resolve(STATE_DIR);
	if (!existsSync(stateDir)) {
		throw new Error(`Keine lokale D1 gefunden: ${stateDir}\n${SETUP_HINT}`);
	}

	const files = readdirSync(stateDir)
		.filter((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
		.sort();

	if (files.length === 0) {
		throw new Error(`Keine .sqlite-Datei in ${stateDir}\n${SETUP_HINT}`);
	}
	if (files.length > 1) {
		console.warn(`[local-d1] Mehrere D1-Dateien gefunden, nehme ${files[0]}.`);
	}

	return path.join(stateDir, files[0]);
}

type Method = 'run' | 'all' | 'values' | 'get';

/** Führt eine Query aus und liefert positionsbasierte Zeilen. */
type RawQuery = (sql: string, params: unknown[], method: Method) => unknown[][];

/** SQLite gibt Blobs als Uint8Array – wie D1 werden sie zu Zahlen-Arrays. */
const jsonSafe = (value: unknown) => (value instanceof Uint8Array ? Array.from(value) : value);

/**
 * `node:sqlite` gibt es ab Node 22/24, aber (Stand Bun 1.2) nicht in Bun. Läuft vite unter
 * Bun, wird deshalb auf `bun:sqlite` ausgewichen – beide können positionsbasierte Zeilen.
 */
async function openDatabase(file: string): Promise<RawQuery> {
	try {
		const { DatabaseSync } = await import('node:sqlite');
		const db = new DatabaseSync(file);

		return (sql, params, method) => {
			const statement = db.prepare(sql);
			if (method === 'run') {
				statement.run(...(params as never[]));
				return [];
			}
			// Positionsbasiert, damit doppelte Spaltennamen (zwei `id` aus einem Join)
			// korrekt zugeordnet bleiben. In den Typen von node:sqlite nicht abgebildet.
			statement.setReturnArrays(true);
			return statement.all(...(params as never[])) as unknown as unknown[][];
		};
	} catch {
		// @ts-expect-error – 'bun:sqlite' existiert nur zur Laufzeit unter Bun.
		const { Database } = await import('bun:sqlite');
		const db = new Database(file);

		return (sql, params, method) => {
			const statement = db.prepare(sql) as {
				run: (...p: never[]) => unknown;
				values: (...p: never[]) => unknown[][];
			};
			if (method === 'run') {
				statement.run(...(params as never[]));
				return [];
			}
			return statement.values(...(params as never[]));
		};
	}
}

export async function createLocalCallbacks() {
	const query = await openDatabase(resolveLocalD1Path());

	const callback = async (sql: string, params: unknown[], method: Method) => {
		const rows = query(sql, params, method).map((row) => row.map(jsonSafe));
		return { rows: method === 'get' ? rows[0] : rows } as { rows: unknown[] };
	};

	const batchCallback = async (queries: { sql: string; params: unknown[]; method: Method }[]) => {
		const out: { rows: unknown[] }[] = [];
		for (const q of queries) out.push(await callback(q.sql, q.params, q.method));
		return out;
	};

	return { callback, batchCallback };
}
