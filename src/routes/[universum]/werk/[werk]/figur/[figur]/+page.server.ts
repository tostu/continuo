import { error } from '@sveltejs/kit';
import { listUniverses, loadUniverse } from '$lib/server/universe-repo';
import { arcsFor, charactersFor, plotPointsFor, workBySlug } from '$lib/universe/derive';
import { appearancesOf } from '$lib/universe/figure-trace';
import type { Universe } from '$lib/universe/types';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () =>
	(await listUniverses()).flatMap(({ slug, universe }) =>
		universe.characters.map((c) => ({ universum: slug, werk: c.workSlug, figur: c.id }))
	);

export const load: PageServerLoad = async ({ params }) => {
	const universe = await loadUniverse(params.universum);
	const work = universe && workBySlug(universe, params.werk);
	const character = work && charactersFor(universe, work.slug).find((c) => c.id === params.figur);
	if (!universe || !work || !character) error(404, 'Figur nicht gefunden');

	// Für die Spur: das ganze Achsengerüst (Werke, Staffeln, Sagas), aber nur die Auftritte
	// dieser einen Figur samt deren Handlungssträngen und Plot Points.
	const appearances = appearancesOf(universe, character.figureId);
	const appearanceWorks = new Set(appearances.map((c) => c.workSlug));
	const trace: Universe = {
		name: universe.name,
		sagas: universe.sagas,
		works: universe.works,
		seasons: universe.seasons,
		arcs: universe.arcs.filter((a) => appearanceWorks.has(a.workSlug)),
		figures: universe.figures.filter((f) => f.id === character.figureId),
		characters: appearances,
		plotPoints: appearances.flatMap((c) => plotPointsFor(universe, c.workSlug, c.id))
	};

	return {
		work,
		character,
		arcs: arcsFor(universe, work.slug),
		points: plotPointsFor(universe, work.slug, character.id),
		trace
	};
};
