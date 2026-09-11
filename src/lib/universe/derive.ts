import type { Arc, Character, PlotPoint, Tone, Universe, Work } from './types';

export const toneVar = (tone: Tone) => `var(--color-${tone})`;

export const workBySlug = (u: Universe, slug: string): Work | undefined =>
	u.works.find((w) => w.slug === slug);

export const sagaOf = (u: Universe, work: Work) => u.sagas.find((s) => s.id === work.sagaId)!;

export const arcsFor = (u: Universe, workSlug: string): Arc[] =>
	u.arcs.filter((a) => a.workSlug === workSlug);

export const charactersFor = (u: Universe, workSlug: string): Character[] =>
	u.characters.filter((c) => c.workSlug === workSlug);

export const plotPointsFor = (u: Universe, workSlug: string, characterId: string): PlotPoint[] =>
	u.plotPoints
		.filter((p) => p.workSlug === workSlug && p.characterId === characterId)
		.sort((a, b) => a.at - b.at);

export interface ArcShare {
	arc: Arc;
	count: number;
}

/** Anteil je Handlungsstrang an den Plot Points einer Figur – Grundlage für den Farbring. */
export function arcShares(u: Universe, workSlug: string, characterId: string): ArcShare[] {
	const points = plotPointsFor(u, workSlug, characterId);
	return arcsFor(u, workSlug)
		.map((arc) => ({ arc, count: points.filter((p) => p.arcId === arc.id).length }))
		.filter((s) => s.count > 0);
}

export const dominantArc = (shares: ArcShare[]): Arc | undefined =>
	shares.reduce<ArcShare | undefined>(
		(best, s) => (!best || s.count > best.count ? s : best),
		undefined
	)?.arc;

export const year = (work: Work) => work.released.slice(0, 4);
