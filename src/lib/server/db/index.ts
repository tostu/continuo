/**
 * D1-Zugriff für continuo-site.
 *
 * Die Seite wird komplett vorgerendert (`prerender = true`), die Load-Funktionen laufen
 * also zur Build-Zeit in Node – dort gibt es kein D1-Binding, denn der Prerenderer von
 * SvelteKit reicht kein `platform` durch. Es gibt deshalb zwei Quellen, beide über
 * `drizzle-orm/sqlite-proxy` und damit über identischen Query-Code:
 *
 * - Remote (Standard, auch im Deploy-Build): D1-REST-API.
 * - Lokal (`D1_LOCAL=true`): die SQLite-Datei, die wrangler unter .wrangler verwaltet.
 *
 * Der fertige Worker liefert nur noch statische Assets aus; zur Laufzeit wird hier
 * nichts mehr aufgerufen.
 */
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { env } from '$env/dynamic/private';
import { createRemoteBatchCallback, createRemoteCallback, type D1HttpCredentials } from './d1-http';
import * as schema from './schema';

export { schema };

export type Database = ReturnType<typeof drizzle>;

function credentials(): D1HttpCredentials {
	const accountId = env.CLOUDFLARE_ACCOUNT_ID;
	const databaseId = env.CLOUDFLARE_DATABASE_ID;
	const token = env.CLOUDFLARE_D1_TOKEN;

	const missing = [
		['CLOUDFLARE_ACCOUNT_ID', accountId],
		['CLOUDFLARE_DATABASE_ID', databaseId],
		['CLOUDFLARE_D1_TOKEN', token]
	]
		.filter(([, value]) => !value)
		.map(([name]) => name);

	if (missing.length) {
		throw new Error(
			`D1-Zugang unvollständig – fehlt: ${missing.join(', ')}.\n` +
				'Werte aus .env.example übernehmen (siehe README, Abschnitt "Daten aus D1").'
		);
	}

	return { accountId: accountId!, databaseId: databaseId!, token: token! };
}

async function create(): Promise<Database> {
	if (env.D1_LOCAL === 'true') {
		// Dynamisch, damit `node:sqlite` nicht im Cloudflare-Bundle landet.
		const { createLocalCallbacks } = await import('./local');
		const { callback, batchCallback } = await createLocalCallbacks();
		return drizzle(callback, batchCallback);
	}

	const creds = credentials();
	return drizzle(createRemoteCallback(creds), createRemoteBatchCallback(creds));
}

let instance: Promise<Database> | undefined;

/**
 * Drizzle-Instanz, einmal pro Prozess. Lazy, damit ein Build ohne D1-Nutzung
 * auch ohne Zugangsdaten bzw. ohne lokalen State durchläuft.
 */
export function getDb(): Promise<Database> {
	return (instance ??= create());
}
