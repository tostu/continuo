/**
 * Schema.org-Objekte für die Rich Results. Absolute URLs nur, wenn `PUBLIC_SITE_URL`
 * gesetzt ist – sonst lässt Google die Angaben lieber weg als falsch stehen.
 */
import { placementTitle, type Placement } from '$lib/universe/placements';
import type { Season, Universe, Work } from '$lib/universe/types';
import { SITE_NAME, SITE_URL, localizedUrl } from './site';

export interface Crumb {
	name: string;
	/** Kanonischer Pfad ohne Sprachpräfix, z. B. `/star-wars/werk/episode-iv`. */
	path: string;
}

export function breadcrumbs(crumbs: Crumb[]) {
	if (!SITE_URL) return [];
	return [
		{
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: crumbs.map((c, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: c.name,
				item: localizedUrl(c.path)
			}))
		}
	];
}

export function websiteSchema(description: string) {
	if (!SITE_URL) return [];
	return [
		{
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: SITE_NAME,
			url: SITE_URL,
			description
		}
	];
}

/**
 * Die Platzierungen eines Universums als geordnete Liste – das ist die „watch order".
 * Eine mehrstaffelige Serie liefert hier eine `ListItem` pro Staffel statt einer fürs
 * ganze Werk, damit ein zwischen zwei Staffeln erschienener Film korrekt einsortiert ist.
 */
export function watchOrderSchema(
	name: string,
	description: string,
	placements: Placement[],
	urlFor: (placement: Placement) => string
) {
	if (!SITE_URL) return [];
	return [
		{
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name,
			description,
			itemListOrder: 'https://schema.org/ItemListOrderAscending',
			numberOfItems: placements.length,
			itemListElement: placements.map((placement, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: placementTitle(placement),
				url: localizedUrl(urlFor(placement))
			}))
		}
	];
}

const episodeCount = (range: [number, number]) => range[1] - range[0] + 1;

export function workSchema(
	work: Work,
	universe: Pick<Universe, 'name'>,
	path: string,
	seasons: Season[] = []
) {
	if (!SITE_URL) return [];
	return [
		{
			'@context': 'https://schema.org',
			'@type': work.kind === 'film' ? 'Movie' : 'TVSeries',
			name: work.title,
			url: localizedUrl(path),
			datePublished: work.released,
			...(work.kind === 'serie'
				? {
						numberOfEpisodes: seasons.length
							? seasons.reduce((sum, s) => sum + episodeCount(s.range), 0)
							: work.range[1]
					}
				: {}),
			...(seasons.length
				? {
						containsSeason: seasons.map((s) => ({
							'@type': 'TVSeason',
							seasonNumber: s.seasonNumber,
							name: s.label,
							datePublished: s.released,
							numberOfEpisodes: episodeCount(s.range)
						}))
					}
				: {}),
			partOfSeries: { '@type': 'CreativeWorkSeries', name: universe.name }
		}
	];
}
