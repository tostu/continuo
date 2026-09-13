import { error } from '@sveltejs/kit';
import { listUniverses } from '$lib/server/universe-repo';
import { charactersFor, workBySlug } from '$lib/universe/derive';
import { loadTmdbData } from '$lib/server/tmdb';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () =>
	(await listUniverses()).flatMap(({ slug, universe }) =>
		universe.works.map((w) => ({ universum: slug, werk: w.slug }))
	);

export const load: PageServerLoad = async ({ params, parent }) => {
	const { universe } = await parent();
	const work = workBySlug(universe, params.werk);
	if (!work) error(404, 'Werk nicht gefunden');

	const characters = charactersFor(universe, work.slug);
	const { poster, photosByCharacterId } = await loadTmdbData(work, characters);

	return { work, poster, photosByCharacterId };
};
