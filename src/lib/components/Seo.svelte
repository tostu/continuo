<script lang="ts">
	import { page } from '$app/state';
	import { baseLocale, deLocalizeUrl, extractLocaleFromUrl, locales } from '$lib/paraglide/runtime';
	import { SITE_NAME, SITE_URL, absolute, localizedPath, localizedUrl } from '$lib/seo/site';

	interface Props {
		/** Vollständiger `<title>`; der Seitenname wird angehängt, außer auf der Startseite. */
		title: string;
		description: string;
		/** Absolute Bild-URL (z. B. Werk-Cover). Ohne Angabe das Standard-Card-Bild. */
		image?: string;
		/** true = 1200×630-Card, false = hochformatiges Poster. */
		wideImage?: boolean;
		imageAlt?: string;
		type?: 'website' | 'article' | 'profile';
		/** Schema.org-Objekte; werden als JSON-LD ausgegeben. */
		jsonLd?: unknown[];
		noindex?: boolean;
	}

	let {
		title,
		description,
		image,
		wideImage = true,
		imageAlt,
		type = 'website',
		jsonLd = [],
		noindex = false
	}: Props = $props();

	// Aus der URL statt aus `getLocale()`, damit der Wert bei Navigation neu berechnet wird.
	const locale = $derived(extractLocaleFromUrl(page.url) ?? baseLocale);

	/** Pfad ohne Sprachpräfix – Basis für Canonical und alle hreflang-Varianten. */
	const canonicalPath = $derived(deLocalizeUrl(page.url).pathname);
	const canonical = $derived(localizedUrl(canonicalPath, locale));
	const alternates = $derived(
		SITE_URL ? locales.map((l) => ({ locale: l, href: localizedUrl(canonicalPath, l) })) : []
	);

	const ogImage = $derived(image ?? absolute('/og-default.png'));
	const ogLocale = $derived(locale === 'de' ? 'de_DE' : 'en_US');

	// Alle `<` maskiert, damit ein schließendes Script-Tag in den Daten das JSON-LD nicht abbricht.
	const ldJson = $derived(
		jsonLd.length
			? JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd).replaceAll('<', '\\u003c')
			: ''
	);
	// Als fertiger String, weil ein Script-Tag im Markup weder Svelte noch ESLint gefällt;
	// das schließende Tag ist gestückelt, sonst endet hier der Script-Block.
	const ldTag = $derived(
		ldJson ? `<script type="application/ld+json">${ldJson}</${'script'}>` : ''
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if noindex}
		<meta name="robots" content="noindex, follow" />
	{/if}

	{#if canonical}
		<link rel="canonical" href={canonical} />
	{/if}
	{#each alternates as alt (alt.locale)}
		<link rel="alternate" hreflang={alt.locale} href={alt.href} />
	{/each}
	{#if SITE_URL}
		<link
			rel="alternate"
			hreflang="x-default"
			href={absolute(localizedPath(canonicalPath, baseLocale))}
		/>
	{/if}

	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:locale" content={ogLocale} />
	{#each locales.filter((l) => l !== locale) as other (other)}
		<meta property="og:locale:alternate" content={other === 'de' ? 'de_DE' : 'en_US'} />
	{/each}
	{#if canonical}
		<meta property="og:url" content={canonical} />
	{/if}
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
		<meta property="og:image:alt" content={imageAlt ?? title} />
		{#if wideImage}
			<meta property="og:image:width" content="1200" />
			<meta property="og:image:height" content="630" />
		{/if}
	{/if}

	<meta name="twitter:card" content={ogImage && wideImage ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if ogImage}
		<meta name="twitter:image" content={ogImage} />
	{/if}

	{#if ldTag}
		<!-- Kein XSS-Risiko: der Inhalt ist selbst erzeugtes, maskiertes JSON-LD. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html ldTag}
	{/if}
</svelte:head>
