/**
 * Schema.org-Objekte für die Rich Results. Absolute URLs nur, wenn `PUBLIC_SITE_URL`
 * gesetzt ist – sonst lässt Google die Angaben lieber weg als falsch stehen.
 */
import type { Universe, Work } from '$lib/universe/types';
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

/** Die Werke eines Universums als geordnete Liste – das ist die „watch order". */
export function watchOrderSchema(
	name: string,
	description: string,
	works: Work[],
	urlFor: (work: Work) => string
) {
	if (!SITE_URL) return [];
	return [
		{
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name,
			description,
			itemListOrder: 'https://schema.org/ItemListOrderAscending',
			numberOfItems: works.length,
			itemListElement: works.map((work, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: work.title,
				url: localizedUrl(urlFor(work))
			}))
		}
	];
}

export function workSchema(work: Work, universe: Universe, path: string, poster?: string) {
	if (!SITE_URL) return [];
	return [
		{
			'@context': 'https://schema.org',
			'@type': work.kind === 'film' ? 'Movie' : 'TVSeries',
			name: work.title,
			url: localizedUrl(path),
			datePublished: work.released,
			...(poster ? { image: poster } : {}),
			...(work.kind === 'serie' ? { numberOfEpisodes: work.range[1] } : {}),
			partOfSeries: { '@type': 'CreativeWorkSeries', name: universe.name }
		}
	];
}
