import { error } from '@sveltejs/kit';
import { universeBySlug, universes } from '$lib/universe/registry';
import { charactersFor, workBySlug } from '$lib/universe/derive';
import { loadTmdbData } from '$lib/server/tmdb';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () =>
	universes.flatMap(({ slug, universe }) =>
		universe.characters.map((c) => ({ universum: slug, werk: c.workSlug, figur: c.id }))
	);

export const load: PageServerLoad = async ({ params }) => {
	const universe = universeBySlug(params.universum)!;
	const work = workBySlug(universe, params.werk);
	const character = work && charactersFor(universe, work.slug).find((c) => c.id === params.figur);
	if (!work || !character) error(404, 'Figur nicht gefunden');

	const { photosByCharacterId } = await loadTmdbData(work, [character]);

	return { work, character, photoUrl: photosByCharacterId[character.id] };
};
