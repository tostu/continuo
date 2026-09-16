/**
 * Ein `Work` ist eine URL/Detailseite, aber nicht mehr zwangsläufig ein einzelner Punkt auf
 * dem Zeitstrahl: eine Serie mit `Season`s liefert einen Platzierungspunkt pro Staffel, damit
 * ein Film zeitlich zwischen zwei Staffeln derselben Serie einsortiert werden kann. Ein Werk
 * ohne Staffeln liefert weiterhin genau eine Platzierung – Verhalten bleibt für alle bisher
 * saisonlosen Werke unverändert.
 */
import { seasonsFor } from './derive';
import type { Season, Universe, Work } from './types';

export interface Placement {
	/** Rail-Knoten-Id: `Work.slug`, oder `${Work.slug}::${Season.id}` bei einer Staffel. */
	slug: string;
	work: Work;
	season?: Season;
	/** Letzte Staffel des Werks – einzige, die den „Läuft gerade"-Puls zeigen darf. */
	isLatestSeason: boolean;
}

export function placementsFor(u: Pick<Universe, 'works' | 'seasons'>): Placement[] {
	return u.works.flatMap((work): Placement[] => {
		const seasons = seasonsFor(u, work.slug);
		if (!seasons.length) return [{ slug: work.slug, work, isLatestSeason: false }];
		return seasons.map((season, i) => ({
			slug: `${work.slug}::${season.id}`,
			work,
			season,
			isLatestSeason: i === seasons.length - 1
		}));
	});
}

export const placementChronology = (p: Placement): number =>
	p.season?.chronology ?? p.work.chronology;
export const placementReleased = (p: Placement): string => p.season?.released ?? p.work.released;
export const placementLoreDate = (p: Placement): string => p.season?.loreDate ?? p.work.loreDate;
export const placementSagaId = (p: Placement): string => p.season?.sagaId ?? p.work.sagaId;
export const placementRequired = (p: Placement): boolean => p.work.required;

export const placementShort = (p: Placement): string =>
	p.season ? `${p.work.short} · ${p.season.label}` : p.work.short;

export const placementTitle = (p: Placement): string =>
	p.season ? `${p.work.title} · ${p.season.label}` : p.work.title;

/** Nur die letzte Staffel eines laufenden Werks pulsiert – sonst würde jede Staffel pulsieren. */
export const placementNowPlaying = (p: Placement): boolean =>
	Boolean(p.work.nowPlaying) && (!p.season || p.isLatestSeason);
