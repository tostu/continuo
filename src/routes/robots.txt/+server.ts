import { SITE_URL } from '$lib/seo/site';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = async () => {
	const body = [
		'# allow crawling everything by default',
		'User-agent: *',
		'Allow: /',
		'',
		// Ohne konfigurierte Domain bringt eine relative Sitemap-Zeile nichts – dann weglassen.
		...(SITE_URL ? [`Sitemap: ${SITE_URL}/sitemap.xml`, ''] : [])
	].join('\n');

	return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
