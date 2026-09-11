import { error } from '@sveltejs/kit';
import { starWars } from '$lib/universe/star-wars';
import { charactersFor, workBySlug } from '$lib/universe/derive';
import { loadTmdbData } from '$lib/server/tmdb';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const work = workBySlug(starWars, params.werk);
	if (!work) error(404, 'Werk nicht gefunden');

	const characters = charactersFor(starWars, work.slug);
	const { poster, photosByCharacterId } = await loadTmdbData(work, characters);

	return { work, poster, photosByCharacterId };
};
