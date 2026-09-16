import { placementReleased, placementRequired, placementSagaId, placementsFor } from './placements';
import { year } from './derive';
import type { Tone, Universe } from './types';

export interface UniverseSummary {
	slug: string;
	name: string;
	sagas: Universe['sagas'];
	from: string | undefined;
	to: string | undefined;
	works: number;
	required: number;
	characters: number;
	plotPoints: number;
	nowPlaying: Universe['works'][number] | undefined;
	nowPlayingTone: Tone;
	dots: { slug: string; x: number; tone: Tone; required: boolean }[];
}

/** Kennzahlen und Mini-Chronologie für die Zeile eines Universums. */
export function summarizeUniverse(slug: string, u: Universe): UniverseSummary {
	const works = [...u.works].sort((a, b) => a.released.localeCompare(b.released));
	const toneOf = new Map(u.sagas.map((s) => [s.id, s.tone]));
	const nowPlaying = works.find((w) => w.nowPlaying);

	// Ein Dot pro Platzierung (Staffel oder Werk), nicht pro Werk – eine mehrstaffelige
	// Serie zeigt so mehrere Punkte, zwischen die ein Film zeitlich fallen kann.
	const placements = [...placementsFor(u)].sort((a, b) =>
		placementReleased(a).localeCompare(placementReleased(b))
	);
	const first = Date.parse(placements[0] ? placementReleased(placements[0]) : '');
	const span = Math.max(
		Date.parse(placements.at(-1) ? placementReleased(placements.at(-1)!) : '') - first,
		1
	);

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
		dots: placements.map((p) => ({
			slug: p.slug,
			x: (Date.parse(placementReleased(p)) - first) / span,
			tone: toneOf.get(placementSagaId(p)) ?? 'neutral',
			required: placementRequired(p)
		}))
	};
}
