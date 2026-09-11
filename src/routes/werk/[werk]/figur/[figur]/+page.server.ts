import { error } from '@sveltejs/kit';
import { starWars } from '$lib/universe/star-wars';
import { charactersFor, workBySlug } from '$lib/universe/derive';
import { loadTmdbData } from '$lib/server/tmdb';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const work = workBySlug(starWars, params.werk);
	const character = work && charactersFor(starWars, work.slug).find((c) => c.id === params.figur);
	if (!work || !character) error(404, 'Figur nicht gefunden');

	const { photosByCharacterId } = await loadTmdbData(work, [character]);

	return { work, character, photoUrl: photosByCharacterId[character.id] };
};
