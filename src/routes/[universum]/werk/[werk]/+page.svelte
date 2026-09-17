<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from 'bits-ui';
	import Avatar from '$lib/components/Avatar.svelte';
	import ArcFilter from '$lib/components/ArcFilter.svelte';
	import SearchField from '$lib/components/SearchField.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { toneVar, year } from '$lib/universe/derive';
	import { reducedMotion, useGsap } from '$lib/motion/gsap';
	import { href } from '$lib/nav';
	import { m } from '$lib/paraglide/messages.js';
	import { breadcrumbs, workSchema } from '$lib/seo/jsonld';

	let { data } = $props();

	const universe = $derived({ name: data.universeName });
	const work = $derived(data.work);
	const saga = $derived(data.saga);
	const arcs = $derived(data.arcs);
	const seasons = $derived(data.seasons);
	const characters = $derived(data.characters.map((c) => ({ ...c, photoUrl: c.character.photo })));

	let query = $state('');
	let selected = $state<string[]>([]);

	const visible = $derived(
		characters.filter(
			({ character, shares }) =>
				character.name.toLowerCase().includes(query.trim().toLowerCase()) &&
				(selected.length === 0 || shares.some((s) => selected.includes(s.arc.id)))
		)
	);

	let grid = $state<HTMLElement>();
	let intro: { progress: (value: number) => { kill: () => void }; kill: () => void } | undefined;
	let flipState: ReturnType<ReturnType<typeof useGsap>['Flip']['getState']> | null = null;

	// Flip: Position vor der Filteränderung merken, nach dem DOM-Update animieren.
	function captureLayout() {
		if (!grid || reducedMotion()) return;
		// Ein noch laufendes Intro würde gegen Flip anarbeiten: erst fertigstellen, dann messen.
		intro?.progress(1).kill();
		intro = undefined;
		flipState = useGsap().Flip.getState(grid.querySelectorAll('[data-flip-id]'));
	}

	$effect(() => {
		void visible;
		if (!flipState || !grid) return;
		const { gsap, Flip } = useGsap();
		const state = flipState;
		flipState = null;
		Flip.from(state, {
			targets: grid.querySelectorAll('[data-flip-id]'),
			duration: 0.5,
			ease: 'power3.inOut',
			onEnter: (els) =>
				gsap.fromTo(
					els,
					{ opacity: 0, scale: 0.7 },
					{ opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }
				)
		});
	});

	onMount(() => {
		if (reducedMotion() || !grid) return;
		const { gsap } = useGsap();
		// Festes Staffelfenster: ein Werk mit dreißig Figuren startet nicht länger als eines mit fünf.
		intro = gsap.from(grid.querySelectorAll('[data-flip-id]'), {
			opacity: 0,
			y: 18,
			duration: 0.5,
			ease: 'power3.out',
			stagger: { amount: 0.5 }
		});
		return () => intro?.kill();
	});
</script>

<Seo
	title={m.seo_work_title({ work: work.title, year: year(work), universe: universe.name })}
	description={m.seo_work_description({
		work: work.title,
		year: year(work),
		universe: universe.name,
		kind: work.kind === 'film' ? m.kind_film() : m.kind_series(),
		saga: saga.name,
		status: work.required ? m.seo_status_required() : m.seo_status_optional()
	})}
	type="article"
	jsonLd={[
		...workSchema(work, universe, `/${data.slug}/werk/${work.slug}`, seasons),
		...breadcrumbs([
			{ name: 'Continuo', path: '/' },
			{ name: universe.name, path: `/${data.slug}` },
			{ name: work.title, path: `/${data.slug}/werk/${work.slug}` }
		])
	]}
/>

<header class="pt-6">
	<Button.Root
		href={href(`/${data.slug}`)}
		class="-ml-2 inline-flex h-10 items-center gap-1 rounded-full pr-3 pl-1.5 text-[14px] font-semibold text-muted transition-colors hover:text-ink"
	>
		<Icon name="back" size={20} />{m.universe_title()}
	</Button.Root>

	<div class="mt-5">
		<p
			class="text-[12px] font-semibold tracking-[0.18em] uppercase"
			style:color={toneVar(saga.tone)}
		>
			{saga.name} · {year(work)}
		</p>
		<h1 class="mt-1.5 text-[34px] leading-[1.02] font-bold tracking-tight">{work.title}</h1>
		<p class="mt-3 flex items-center gap-2 text-[14px] text-muted">
			<Icon name={work.kind === 'film' ? 'film' : 'tv'} size={16} />
			{work.kind === 'film' ? m.kind_film() : m.kind_series()} ·
			{work.unit === 'Min.' ? `${work.range[1]} Min.` : `${work.range[1]} Folgen`} ·
			{work.required ? m.required() : m.optional()}
		</p>

		{#if seasons.length}
			<ul class="mt-4 flex flex-col gap-1.5">
				{#each seasons as season (season.id)}
					<li
						class="flex items-center justify-between gap-3 rounded-xl bg-surface px-3.5 py-2 text-[13px] ring-1 ring-hairline"
					>
						<span class="font-semibold text-ink">{season.label}</span>
						<span class="text-muted">{season.loreDate}</span>
						<span class="text-muted tabular-nums">
							{season.range[1] - season.range[0] + 1}
							{work.unit === 'Min.' ? 'Min.' : 'Folgen'}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</header>

{#if characters.length === 0}
	<div class="mt-10 rounded-[20px] bg-card p-6 ring-1 ring-hairline">
		<p class="font-serif text-[20px] leading-snug">{m.no_characters()}</p>
		<Button.Root
			href={href(`/${data.slug}`)}
			class="mt-5 inline-flex h-11 items-center rounded-full bg-arc-1 px-5 text-[14px] font-semibold text-white"
		>
			{m.back_home()}
		</Button.Root>
	</div>
{:else}
	<p class="mt-7 flex items-end gap-3">
		<span class="text-[64px] leading-[0.8] font-bold tracking-tight text-arc-1 tabular-nums">
			{characters.length}
		</span>
		<span class="max-w-40 text-[15px] leading-snug text-muted">{m.characters_in_work()}</span>
	</p>

	<div class="mt-7 flex flex-col gap-4">
		<SearchField
			bind:value={query}
			placeholder={m.search_placeholder()}
			onbeforechange={captureLayout}
		/>
		<ArcFilter
			{arcs}
			bind:value={selected}
			label={m.arc_filter_label()}
			onbeforechange={captureLayout}
		/>
	</div>

	<ul bind:this={grid} class="mt-8 grid grid-cols-3 gap-x-3 gap-y-7 pb-12">
		{#each visible as { character, photoUrl, shares, count }, i (character.id)}
			<li data-flip-id={character.id}>
				<a
					href={href(`/${data.slug}/werk/${work.slug}/figur/${character.id}`)}
					class="group flex flex-col items-center gap-2 rounded-2xl text-center focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
				>
					<span class="transition-[scale] duration-200 group-hover:scale-105">
						<Avatar
							initials={character.initials}
							{photoUrl}
							{shares}
							size={86}
							delay={0.15 + (i / Math.max(visible.length - 1, 1)) * 0.5}
							transitionName="avatar-{character.id}"
						/>
					</span>
					<span class="text-[13.5px] leading-tight font-semibold">{character.name}</span>
					<span class="-mt-1 text-[11.5px] text-muted">{m.plot_points_count({ count })}</span>
				</a>
			</li>
		{/each}
	</ul>

	{#if visible.length === 0}
		<p class="-mt-6 pb-12 text-center font-serif text-[18px] text-muted">{m.no_results()}</p>
	{/if}
{/if}
