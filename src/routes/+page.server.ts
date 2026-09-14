import { listUniverses } from '$lib/server/universe-repo';
import {
	arcShares,
	arcsFor,
	charactersFor,
	plotPointsFor,
	sagaOf,
	workBySlug,
	year
} from '$lib/universe/derive';
import type { Universe, ZoomModel } from '$lib/universe/types';
import type { PageServerLoad } from './$types';

/** Kennzahlen und Mini-Chronologie für die Zeile eines Universums. */
function summarize(slug: string, u: Universe) {
	const works = [...u.works].sort((a, b) => a.released.localeCompare(b.released));
	const first = Date.parse(works[0]?.released ?? '');
	const span = Math.max(Date.parse(works.at(-1)?.released ?? '') - first, 1);
	const toneOf = new Map(u.sagas.map((s) => [s.id, s.tone]));
	const nowPlaying = works.find((w) => w.nowPlaying);

	return {
		slug,
		name: u.name,
		sagas: u.sagas,
		from: works[0] && year(works[0]),
		to: works.at(-1) && year(works.at(-1)!),
		works: works.length,
		required: works.filter((w) => w.required).length,
		characters: u.characters.length,
		plotPoints: u.plotPoints.length,
		nowPlaying,
		nowPlayingTone: toneOf.get(nowPlaying?.sagaId ?? '') ?? 'arc-1',
		dots: works.map((w) => ({
			slug: w.slug,
			x: (Date.parse(w.released) - first) / span,
			tone: toneOf.get(w.sagaId) ?? 'neutral',
			required: w.required
		}))
	};
}

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

	return {
		rows: universes.map(({ slug, universe }) => summarize(slug, universe)),
		zoom
	};
};
