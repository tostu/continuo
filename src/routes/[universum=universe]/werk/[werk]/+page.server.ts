import { error } from '@sveltejs/kit';
import { universeBySlug, universes } from '$lib/universe/registry';
import { charactersFor, workBySlug } from '$lib/universe/derive';
import { loadTmdbData } from '$lib/server/tmdb';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () =>
	universes.flatMap(({ slug, universe }) =>
		universe.works.map((w) => ({ universum: slug, werk: w.slug }))
	);

export const load: PageServerLoad = async ({ params }) => {
	const universe = universeBySlug(params.universum)!;
	const work = workBySlug(universe, params.werk);
	if (!work) error(404, 'Werk nicht gefunden');

	const characters = charactersFor(universe, work.slug);
	const { poster, photosByCharacterId } = await loadTmdbData(work, characters);

	return { work, poster, photosByCharacterId };
};
