import { error } from '@sveltejs/kit';
import { listUniverses } from '$lib/server/universe-repo';
import { charactersFor, workBySlug } from '$lib/universe/derive';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () =>
	(await listUniverses()).flatMap(({ slug, universe }) =>
		universe.characters.map((c) => ({ universum: slug, werk: c.workSlug, figur: c.id }))
	);

export const load: PageServerLoad = async ({ params, parent }) => {
	const { universe } = await parent();
	const work = workBySlug(universe, params.werk);
	const character = work && charactersFor(universe, work.slug).find((c) => c.id === params.figur);
	if (!work || !character) error(404, 'Figur nicht gefunden');

	return { work, character };
};
