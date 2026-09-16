<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import HeroLine from '$lib/components/HeroLine.svelte';
	import ZoomDemo from '$lib/components/ZoomDemo.svelte';
	import UniverseListItem from '$lib/components/UniverseListItem.svelte';
	import { href } from '$lib/nav';
	import { m } from '$lib/paraglide/messages.js';
	import { websiteSchema } from '$lib/seo/jsonld';

	let { data } = $props();

	// Aus D1 gelesen und beim Prerendering fertig berechnet – siehe +page.server.ts.
	// Nur eine Vorschau: die Startseite zeigt höchstens `LANDING_UNIVERSE_LIMIT` Zeilen,
	// die volle, durchsuch- und sortierbare Liste lebt auf /universen.
	const rows = $derived(data.rows);
	const total = $derived(data.total);
	const totalWorks = $derived(data.totalWorks);

	let hero = $state<HTMLElement>();
	let headline = $state<HTMLElement>();
</script>

<Seo
	title={m.seo_landing_title()}
	description={m.seo_landing_description()}
	jsonLd={websiteSchema(m.seo_landing_description())}
/>

<header class="pt-8">
	<p class="text-[17px] font-bold tracking-tight">Continuo</p>
</header>

<section bind:this={hero} class="relative pt-16 sm:pt-24" aria-labelledby="landing-title">
	{#if hero && headline}
		<HeroLine host={hero} {headline} />
	{/if}
	<h1
		bind:this={headline}
		id="landing-title"
		class="relative max-w-[14ch] text-[44px] leading-[0.98] font-bold tracking-[-0.035em] text-balance sm:text-[68px] lg:text-[80px]"
	>
		{m.landing_title()}
	</h1>
	<p
		class="relative mt-12 max-w-[42ch] font-serif text-[18px] leading-[1.55] text-muted sm:text-[19px]"
	>
		{m.landing_intro()}
	</p>
	<a
		href="#universen"
		class="relative mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-ink pr-2 pl-5 text-[15px] font-semibold text-ground transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
	>
		{m.landing_cta()}
		<span class="grid size-8 place-items-center rounded-full bg-ground text-ink">
			<Icon name="arrow-down" size={16} />
		</span>
	</a>
</section>

<section class="mt-32 sm:mt-40" aria-labelledby="zoom-title">
	<h2
		id="zoom-title"
		class="max-w-[20ch] text-[30px] leading-[1.05] font-bold tracking-[-0.025em] text-balance sm:text-[40px]"
	>
		{m.zoom_title()}
	</h2>

	<ZoomDemo zoom={data.zoom} />
</section>

<section id="universen" class="mt-32 scroll-mt-8 pb-20 sm:mt-40" aria-labelledby="pick-title">
	<h2
		id="pick-title"
		class="text-[30px] leading-[1.05] font-bold tracking-[-0.025em] sm:text-[40px]"
	>
		{m.pick_title()}
	</h2>
	<p class="mt-3 font-serif text-[17px] text-muted">
		{m.pick_summary({ count: total, works: totalWorks })}
	</p>

	<ul class="mt-10 border-t border-hairline">
		{#each rows as row (row.slug)}
			<li class="border-b border-hairline">
				<UniverseListItem {row} />
			</li>
		{/each}
	</ul>

	{#if total > rows.length}
		<a
			href={href('/universen')}
			class="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-card pr-3 pl-5 text-[15px] font-semibold text-ink ring-1 ring-hairline transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
		>
			{m.see_all_universes({ count: total })}
			<span class="grid size-8 place-items-center rounded-full bg-raised text-ink">
				<Icon name="back" size={16} class="rotate-180" />
			</span>
		</a>
	{/if}
</section>
