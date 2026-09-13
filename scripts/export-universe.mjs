// Dump one or all universes as JSON, e.g. to paste into an AI chat for review.
//
// Usage:
//   node scripts/export-universe.mjs <slug|all> [--local] [--out <dir>]
//
// Reuses `loadUniverse`/`listUniverseSlugs` from `src/lib/server/universe-repo.ts`
// via Vite's SSR module loader, so it resolves `$lib`/`$env` exactly like the
// real build does and never duplicates the D1 query logic.

import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const local = args.includes('--local');
const outIdx = args.indexOf('--out');
const outDir = outIdx !== -1 ? args[outIdx + 1] : '.';
const target = args.find((a) => !a.startsWith('--') && a !== outDir) ?? 'all';

if (local) process.env.D1_LOCAL = 'true';

const server = await createServer({ server: { middlewareMode: true } });

try {
	const repo = await server.ssrLoadModule('/src/lib/server/universe-repo.ts');

	const slugs = target === 'all' ? await repo.listUniverseSlugs() : [target];
	await mkdir(outDir, { recursive: true });

	for (const slug of slugs) {
		const universe = await repo.loadUniverse(slug);
		if (!universe) {
			console.error(`No universe found for slug "${slug}"`);
			continue;
		}
		const file = path.join(outDir, `${slug}.json`);
		await writeFile(file, JSON.stringify(universe, null, 2));
		console.log(`Wrote ${file}`);
	}
} finally {
	await server.close();
}
