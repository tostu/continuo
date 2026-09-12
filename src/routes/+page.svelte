<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import HeroLine from '$lib/components/HeroLine.svelte';
	import ZoomDemo from '$lib/components/ZoomDemo.svelte';
	import { universes } from '$lib/universe/registry';
	import { toneVar, year } from '$lib/universe/derive';
	import type { Universe } from '$lib/universe/types';
	import { href } from '$lib/nav';
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();

	/** Kennzahlen und Mini-Chronologie für die Zeile eines Universums. */
	function summarize(slug: string, u: Universe) {
		const works = [...u.works].sort((a, b) => a.released.localeCompare(b.released));
		const first = Date.parse(works[0]?.released ?? '');
		const span = Math.max(Date.parse(works.at(-1)?.released ?? '') - first, 1);
		const toneOf = new Map(u.sagas.map((s) => [s.id, s.tone]));
		const nowPlaying = works.find((w) => w.nowPlaying);

		return {
			slug,
			name: u.name,
			sagas: u.sagas,
			from: works[0] && year(works[0]),
			to: works.at(-1) && year(works.at(-1)!),
			works: works.length,
			required: works.filter((w) => w.required).length,
			characters: u.characters.length,
			plotPoints: u.plotPoints.length,
			nowPlaying,
			nowPlayingTone: toneOf.get(nowPlaying?.sagaId ?? '') ?? 'arc-1',
			dots: works.map((w) => ({
				slug: w.slug,
				x: (Date.parse(w.released) - first) / span,
				tone: toneOf.get(w.sagaId) ?? 'neutral',
				required: w.required
			}))
		};
	}

	const rows = universes.map(({ slug, universe }) => summarize(slug, universe));
	const totalWorks = rows.reduce((sum, r) => sum + r.works, 0);

	let hero = $state<HTMLElement>();
	let headline = $state<HTMLElement>();
</script>

<svelte:head>
	<title>Continuo · {m.landing_title()}</title>
	<meta name="description" content={m.landing_intro()} />
</svelte:head>

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

	<ZoomDemo photos={data.photosByCharacterId} />
</section>

<section id="universen" class="mt-32 scroll-mt-8 pb-20 sm:mt-40" aria-labelledby="pick-title">
	<h2
		id="pick-title"
		class="text-[30px] leading-[1.05] font-bold tracking-[-0.025em] sm:text-[40px]"
	>
		{m.pick_title()}
	</h2>
	<p class="mt-3 font-serif text-[17px] text-muted">
		{m.pick_summary({ count: rows.length, works: totalWorks })}
	</p>

	<ul class="mt-10 border-t border-hairline">
		{#each rows as row (row.slug)}
			<li class="border-b border-hairline">
				<a
					href={href(`/${row.slug}`)}
					class="group -mx-3 block rounded-2xl px-3 py-8 transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-ink sm:-mx-5 sm:px-5 sm:py-10"
				>
					<div class="flex items-baseline justify-between gap-4">
						<h3 class="text-[32px] leading-none font-bold tracking-[-0.03em] sm:text-[44px]">
							{row.name}
						</h3>
						<span class="shrink-0 text-[15px] text-muted tabular-nums">{row.from}–{row.to}</span>
					</div>

					<!-- Mini-Chronologie: jedes Werk ein Punkt, x = Erscheinungsdatum. -->
					<div class="relative mx-1.5 mt-8 h-5" aria-hidden="true">
						<span class="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-neutral"></span>
						{#each row.dots as dot (dot.slug)}
							<span
								class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full {dot.required
									? 'size-4 ring-2 ring-ground group-hover:ring-card'
									: 'size-3.5 border-2 bg-ground group-hover:bg-card'}"
								style:left="{dot.x * 100}%"
								style:background-color={dot.required ? toneVar(dot.tone) : undefined}
								style:border-color={dot.required ? undefined : toneVar(dot.tone)}
							></span>
						{/each}
					</div>

					<ul class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
						{#each row.sagas as saga (saga.id)}
							<li class="inline-flex items-center gap-1.5 text-[13px] text-muted">
								<span class="size-2 rounded-full" style:background-color={toneVar(saga.tone)}
								></span>
								{saga.name}
							</li>
						{/each}
					</ul>

					<div class="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
						<dl class="flex flex-wrap gap-x-6 gap-y-1 text-[14px] text-muted">
							<div>
								<dt class="sr-only">{m.stat_works()}</dt>
								<dd>
									<span class="font-semibold text-ink tabular-nums">{row.works}</span>
									{m.works_summary({ required: row.required })}
								</dd>
							</div>
							<div>
								<dt class="sr-only">{m.stat_characters()}</dt>
								<dd>
									<span class="font-semibold text-ink tabular-nums">{row.characters}</span>
									{m.stat_characters()}
								</dd>
							</div>
							<div>
								<dt class="sr-only">{m.stat_plot_points()}</dt>
								<dd>
									<span class="font-semibold text-ink tabular-nums">{row.plotPoints}</span>
									{m.stat_plot_points()}
								</dd>
							</div>
							{#if row.nowPlaying}
								<div
									class="inline-flex items-center gap-1.5"
									style:color={toneVar(row.nowPlayingTone)}
								>
									<dt class="inline-flex items-center gap-1.5">
										<Icon name="play" size={10} />{m.now_playing()}:
									</dt>
									<dd class="font-semibold">{row.nowPlaying.short}</dd>
								</div>
							{/if}
						</dl>
						<span class="inline-flex items-center gap-3 text-[15px] font-semibold">
							{m.open_timeline()}
							<span
								class="grid size-9 place-items-center rounded-full bg-raised transition-colors group-hover:bg-ink group-hover:text-ground"
							>
								<Icon name="back" size={18} class="rotate-180" />
							</span>
						</span>
					</div>
				</a>
			</li>
		{/each}
	</ul>
</section>
