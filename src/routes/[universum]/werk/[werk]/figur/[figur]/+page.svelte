<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from 'bits-ui';
	import Avatar from '$lib/components/Avatar.svelte';
	import PlotTimeline from '$lib/components/PlotTimeline.svelte';
	import PlotCard from '$lib/components/PlotCard.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ImageCredit from '$lib/components/ImageCredit.svelte';
	import FigureTrace from '$lib/components/FigureTrace.svelte';
	import { arcShares, arcsFor, dominantArc, plotPointsFor, toneVar } from '$lib/universe/derive';
	import { appearancesOf } from '$lib/universe/figure-trace';
	import { reducedMotion, useGsap } from '$lib/motion/gsap';
	import { href } from '$lib/nav';
	import { m } from '$lib/paraglide/messages.js';
	import { breadcrumbs } from '$lib/seo/jsonld';

	let { data } = $props();

	const universe = $derived(data.universe);
	const work = $derived(data.work);
	const character = $derived(data.character);
	const arcs = $derived(arcsFor(universe, work.slug));
	const points = $derived(plotPointsFor(universe, work.slug, character.id));
	const shares = $derived(arcShares(universe, work.slug, character.id));
	const lead = $derived(dominantArc(shares));
	const arcById = $derived(new Map(arcs.map((a) => [a.id, a])));
	const appearances = $derived(appearancesOf(universe, character.figureId).length);

	let list: HTMLOListElement;
	/** Hochzählende Kennzahl; null = Endwert (SSR, reduzierte Bewegung). */
	let shown = $state<number | null>(null);

	onMount(() => {
		if (reducedMotion()) return;
		const { gsap } = useGsap();
		const tl = gsap.timeline();
		const counter = { n: 0 };
		tl.to(counter, {
			n: points.length,
			duration: 0.9,
			ease: 'power2.out',
			onUpdate: () => (shown = Math.round(counter.n))
		});
		tl.from(
			list.children,
			{ opacity: 0, y: 24, duration: 0.55, ease: 'power3.out', stagger: 0.09 },
			0.35
		);
		return () => tl.kill();
	});
</script>

<Seo
	title={m.seo_character_title({ character: character.name, work: work.title })}
	description={m.seo_character_description({
		character: character.name,
		work: work.title,
		universe: universe.name
	})}
	image={character.photo}
	wideImage={false}
	imageAlt={character.name}
	type="profile"
	jsonLd={breadcrumbs([
		{ name: 'Continuo', path: '/' },
		{ name: universe.name, path: `/${data.slug}` },
		{ name: work.title, path: `/${data.slug}/werk/${work.slug}` },
		{ name: character.name, path: `/${data.slug}/werk/${work.slug}/figur/${character.id}` }
	])}
/>

<header class="pt-6">
	<Button.Root
		href={href(`/${data.slug}/werk/${work.slug}`)}
		class="-ml-2 inline-flex h-10 items-center gap-1 rounded-full pr-3 pl-1.5 text-[14px] font-semibold text-muted transition-colors hover:text-ink"
	>
		<Icon name="back" size={20} />{work.short}
	</Button.Root>
	<h1 class="mt-4 text-[44px] leading-[0.95] font-bold tracking-tight">{character.name}</h1>
</header>

<div class="mt-8 flex flex-col items-center">
	<Avatar
		initials={character.initials}
		photoUrl={character.photo}
		{shares}
		size={172}
		delay={0.15}
		transitionName="avatar-{character.id}"
	/>
	<ImageCredit text={character.photoCredit} />
	{#if appearances > 1}
		<a
			href="#spur"
			class="mt-5 inline-flex h-9 items-center gap-1.5 rounded-full bg-surface pr-3.5 pl-2.5 text-[13px] font-semibold text-ink ring-1 ring-hairline transition-colors hover:bg-raised focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
		>
			<Icon name="arrow-down" size={16} />
			{m.trace_chip({ count: appearances, total: universe.works.length })}
		</a>
	{/if}
</div>

<p class="mt-10 flex items-end gap-4">
	<span
		class="text-[96px] leading-[0.78] font-bold tracking-tighter tabular-nums"
		style:color={toneVar(lead?.tone ?? 'arc-1')}
	>
		{shown ?? points.length}
	</span>
	<span class="pb-0.5 text-[16px] leading-snug text-muted">
		{m.plot_points_in()}<br />{work.short}
	</span>
</p>

<div class="mt-8">
	<PlotTimeline {points} {arcs} {work} />
</div>

<ol bind:this={list} class="mt-8 flex flex-col gap-4 pb-14">
	{#each points as point (point.id)}
		<li>
			<PlotCard {point} arc={arcById.get(point.arcId)!} unit={work.unit} />
		</li>
	{/each}
</ol>

<FigureTrace {universe} slug={data.slug} {character} />
