import { listUniverses } from '$lib/server/universe-repo';
import {
	arcShares,
	arcsFor,
	charactersFor,
	plotPointsFor,
	sagaOf,
	workBySlug
} from '$lib/universe/derive';
import { summarizeUniverse } from '$lib/universe/summarize';
import type { Universe, ZoomModel } from '$lib/universe/types';
import type { PageServerLoad } from './$types';

/** Zahl der Universen, die auf der Startseite als Vorschau gezeigt werden. */
const LANDING_UNIVERSE_LIMIT = 3;

/**
 * Zugeschnittenes Modell für das Zoom-Beispiel: Star Wars → Episode IV → eine Figur.
 * Nur was die drei Stufen zeigen – die Komponente wechselt die Figur im Browser, deshalb
 * müssen die Plot Points aller sechs Figuren mit, nicht nur die der ersten.
 */
function zoomModel(universe: Universe): ZoomModel {
	const work = workBySlug(universe, 'episode-iv')!;

	return {
		universeName: universe.name,
		work,
		arcs: arcsFor(universe, work.slug),
		railWorks: [...universe.works]
			.sort((a, b) => a.released.localeCompare(b.released))
			.slice(0, 7)
			.map((w) => ({ work: w, tone: sagaOf(universe, w).tone })),
		cast: charactersFor(universe, work.slug)
			.slice(0, 6)
			.map((character) => ({
				character,
				shares: arcShares(universe, work.slug, character.id),
				points: plotPointsFor(universe, work.slug, character.id)
			}))
	};
}

export const load: PageServerLoad = async () => {
	const universes = await listUniverses();
	const starWars = universes.find((u) => u.slug === 'star-wars')!.universe;
	const zoom = zoomModel(starWars);

	const rows = universes.map(({ slug, universe }) => summarizeUniverse(slug, universe));

	return {
		rows: rows.slice(0, LANDING_UNIVERSE_LIMIT),
		total: rows.length,
		totalWorks: rows.reduce((sum, r) => sum + r.works, 0),
		zoom
	};
};
