import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Remote-D1 über HTTP – für `bun run db:generate` und `drizzle-kit studio` gegen die
 * echte Datenbank. Schema, Migrationen und Seed gehören zu diesem Repo.
 */
export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
		databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
		token: process.env.CLOUDFLARE_D1_TOKEN!
	}
});
