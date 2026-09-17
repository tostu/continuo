import { error } from '@sveltejs/kit';
import { listUniverses, loadUniverse } from '$lib/server/universe-repo';
import {
	arcShares,
	arcsFor,
	charactersFor,
	plotPointsFor,
	sagaOf,
	seasonsFor,
	workBySlug
} from '$lib/universe/derive';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () =>
	(await listUniverses()).flatMap(({ slug, universe }) =>
		universe.works.map((w) => ({ universum: slug, werk: w.slug }))
	);

/** Die Werkseite zeigt Plot Points nur als Zahl und Farbring – die Texte bleiben draußen. */
export const load: PageServerLoad = async ({ params }) => {
	const universe = await loadUniverse(params.universum);
	const work = universe && workBySlug(universe, params.werk);
	if (!universe || !work) error(404, 'Werk nicht gefunden');

	return {
		universeName: universe.name,
		work,
		saga: sagaOf(universe, work),
		arcs: arcsFor(universe, work.slug),
		seasons: seasonsFor(universe, work.slug),
		characters: charactersFor(universe, work.slug).map((character) => ({
			character,
			shares: arcShares(universe, work.slug, character.id),
			count: plotPointsFor(universe, work.slug, character.id).length
		}))
	};
};
