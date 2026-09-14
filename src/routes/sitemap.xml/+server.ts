/**
 * Vollständige Sitemap: Startseite, Universen, Werke und Figuren – jeweils in beiden
 * Sprachen, mit `xhtml:link`-Alternates, damit Google die de/en-Paare zusammenführt.
 * Wird beim Prerendering einmal gebaut, der Worker liefert nur noch die Datei aus.
 */
import { listUniverses } from '$lib/server/universe-repo';
import { baseLocale, locales } from '$lib/paraglide/runtime';
import { SITE_URL, localizedUrl } from '$lib/seo/site';
import type { RequestHandler } from './$types';

export const prerender = true;

interface Entry {
	/** Kanonischer Pfad ohne Sprachpräfix. */
	path: string;
	priority: string;
	changefreq: string;
}

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function urlEntry({ path, priority, changefreq }: Entry, lastmod: string) {
	const alternates = locales
		.map(
			(locale) =>
				`\t\t<xhtml:link rel="alternate" hreflang="${locale}" href="${xml(localizedUrl(path, locale))}" />`
		)
		.join('\n');

	return locales
		.map((locale) =>
			[
				'\t<url>',
				`\t\t<loc>${xml(localizedUrl(path, locale))}</loc>`,
				alternates,
				`\t\t<xhtml:link rel="alternate" hreflang="x-default" href="${xml(localizedUrl(path, baseLocale))}" />`,
				`\t\t<lastmod>${lastmod}</lastmod>`,
				`\t\t<changefreq>${changefreq}</changefreq>`,
				`\t\t<priority>${priority}</priority>`,
				'\t</url>'
			].join('\n')
		)
		.join('\n');
}

export const GET: RequestHandler = async () => {
	if (!SITE_URL) {
		console.warn('[sitemap] PUBLIC_SITE_URL ist nicht gesetzt – Sitemap bleibt leer.');
		return new Response(
			'<?xml version="1.0" encoding="UTF-8"?>\n' +
				'<!-- PUBLIC_SITE_URL ist nicht gesetzt; ohne Domain lassen sich keine absoluten URLs bauen. -->\n' +
				'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
			{ headers: { 'content-type': 'application/xml; charset=utf-8' } }
		);
	}

	const universes = await listUniverses();
	const lastmod = new Date().toISOString().slice(0, 10);

	const entries: Entry[] = [{ path: '/', priority: '1.0', changefreq: 'weekly' }];

	for (const { slug, universe } of universes) {
		// Die Universums-Seite ist die Zielseite für „<Universum> Reihenfolge".
		entries.push({ path: `/${slug}`, priority: '0.9', changefreq: 'weekly' });

		for (const work of universe.works) {
			entries.push({ path: `/${slug}/werk/${work.slug}`, priority: '0.7', changefreq: 'monthly' });
		}
		for (const character of universe.characters) {
			entries.push({
				path: `/${slug}/werk/${character.workSlug}/figur/${character.id}`,
				priority: '0.5',
				changefreq: 'monthly'
			});
		}
	}

	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...entries.map((entry) => urlEntry(entry, lastmod)),
		'</urlset>'
	].join('\n');

	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
