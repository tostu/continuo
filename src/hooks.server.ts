import type { Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';

const LD_JSON_SCRIPT = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const CSP_META = /(<meta http-equiv="content-security-policy" content=")([^"]*)(")/;

async function sha256Base64(text: string) {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
	return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

/**
 * Seo.svelte injects its JSON-LD via {@html}, so SvelteKit's own CSP hash collection never
 * sees it. Compute the hash of whatever actually got rendered on this page and splice it
 * into the script-src the `csp` config in vite.config.ts already put in the CSP meta tag.
 */
async function addLdJsonHashes(html: string) {
	if (!html.includes('application/ld+json')) return html;

	const hashes = new Set<string>();
	for (const match of html.matchAll(LD_JSON_SCRIPT)) {
		hashes.add(`sha256-${await sha256Base64(match[1])}`);
	}
	if (hashes.size === 0) return html;

	const extra = [...hashes].map((hash) => `'${hash}'`).join(' ');
	return html.replace(
		CSP_META,
		(_full, pre, content, post) =>
			`${pre}${content.replace(/script-src([^;]*)/, (m: string) => `${m} ${extra}`)}${post}`
	);
}

export const handle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: async ({ html }) =>
				addLdJsonHashes(
					html
						.replace('%paraglide.lang%', locale)
						.replace('%paraglide.dir%', getTextDirection(locale))
				)
		});
	});
