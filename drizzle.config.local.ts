import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { resolveLocalD1Path } from './src/lib/server/db/local';

/**
 * Lokale D1 – für `bun run db:studio:local`.
 *
 * Dieselbe SQLite-Datei, die auch `bun run dev:local` liest und die wrangler unter
 * .wrangler/state/v3/d1 verwaltet. Pfad per `D1_LOCAL_PATH` überschreibbar.
 */
export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',
	dbCredentials: {
		url: resolveLocalD1Path()
	}
});
