import { listUniverses } from '$lib/server/universe-repo';
import { summarizeUniverse } from '$lib/universe/summarize';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const universes = await listUniverses();

	return {
		// Reihenfolge aus der DB (sortOrder) ist die "kuratierte" Sortierung im UI.
		rows: universes.map(({ slug, universe }) => summarizeUniverse(slug, universe))
	};
};
