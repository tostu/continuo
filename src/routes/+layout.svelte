<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onNavigate } from '$app/navigation';
	import { Tooltip } from 'bits-ui';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { reducedMotion } from '$lib/motion/gsap';
	import './layout.css';

	let { children } = $props();

	// Weiche Screen-Übergänge; Elemente mit gleichem view-transition-name (z. B. Avatare) wandern mit.
	onNavigate((navigation) => {
		if (!document.startViewTransition || reducedMotion()) return;
		return new Promise((done) => {
			document.startViewTransition(async () => {
				done();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<link rel="icon" href="/favicon.ico" sizes="32x32" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="mask-icon" href="/mask-icon.svg" color="#17a37c" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="theme-color" content="#0f0f0f" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Space+Grotesk:wght@400;500;600;700&display=swap"
	/>
</svelte:head>

<Tooltip.Provider delayDuration={250}>
	<div class="mx-auto min-h-dvh w-full max-w-[420px] px-5 sm:max-w-2xl lg:max-w-4xl">
		{@render children()}
	</div>
</Tooltip.Provider>

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
