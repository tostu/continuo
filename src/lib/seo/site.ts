import { env } from '$env/dynamic/public';
import { localizeHref } from '$lib/paraglide/runtime';
import type { Locale } from '$lib/paraglide/runtime';

/**
 * Absolute Basis-URL der veröffentlichten Seite, ohne Slash am Ende.
 * Leer, solange `PUBLIC_SITE_URL` nicht gesetzt ist – dann bleiben Canonical,
 * hreflang, og:image und Sitemap weg, statt auf eine falsche Domain zu zeigen.
 */
export const SITE_URL = (env.PUBLIC_SITE_URL ?? '').replace(/\/+$/, '');

export const SITE_NAME = 'Continuo';

/**
 * Sprachpfad einer kanonischen Route, z. B. `/star-wars` → `/en/star-wars`.
 * Ohne Slash am Ende, weil SvelteKit sonst auf die Variante ohne umleitet und
 * Canonical, hreflang und Sitemap auf eine Weiterleitung zeigen würden.
 */
export function localizedPath(path: string, locale?: Locale) {
	const localized = localizeHref(path, locale ? { locale } : undefined);
	return localized.length > 1 ? localized.replace(/\/+$/, '') : localized;
}

/** Absolute URL für einen App-Pfad; leer, wenn keine Domain konfiguriert ist. */
export const absolute = (path: string) => (SITE_URL ? `${SITE_URL}${path}` : '');

/** Absolute URL einer kanonischen Route in der gewünschten Sprache. */
export const localizedUrl = (path: string, locale?: Locale) =>
	absolute(localizedPath(path, locale));
