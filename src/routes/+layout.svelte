<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onNavigate } from '$app/navigation';
	import { Tooltip } from 'bits-ui';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { reducedMotion } from '$lib/motion/gsap';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

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
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Space+Grotesk:wght@400;500;600;700&display=swap"
	/>
</svelte:head>

<Tooltip.Provider delayDuration={250}>
	<div class="mx-auto min-h-dvh w-full max-w-[420px] px-5">
		{@render children()}
	</div>
</Tooltip.Provider>

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
