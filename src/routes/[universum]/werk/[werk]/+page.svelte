<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from 'bits-ui';
	import Avatar from '$lib/components/Avatar.svelte';
	import ArcFilter from '$lib/components/ArcFilter.svelte';
	import SearchField from '$lib/components/SearchField.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import {
		arcShares,
		arcsFor,
		charactersFor,
		plotPointsFor,
		sagaOf,
		toneVar,
		year
	} from '$lib/universe/derive';
	import { reducedMotion, useGsap } from '$lib/motion/gsap';
	import { href } from '$lib/nav';
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();

	const universe = $derived(data.universe);
	const work = $derived(data.work);
	const saga = $derived(sagaOf(universe, work));
	const arcs = $derived(arcsFor(universe, work.slug));
	const characters = $derived(
		charactersFor(universe, work.slug).map((character) => ({
			character,
			photoUrl: data.photosByCharacterId[character.id],
			shares: arcShares(universe, work.slug, character.id),
			count: plotPointsFor(universe, work.slug, character.id).length
		}))
	);

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
	let flipState: ReturnType<ReturnType<typeof useGsap>['Flip']['getState']> | null = null;

	// Flip: Position vor der Filteränderung merken, nach dem DOM-Update animieren.
	function captureLayout() {
		if (!grid || reducedMotion()) return;
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
		const tween = gsap.from(grid.querySelectorAll('[data-flip-id]'), {
			opacity: 0,
			y: 18,
			duration: 0.5,
			ease: 'power3.out',
			stagger: 0.05
		});
		return () => tween.kill();
	});
</script>

<svelte:head>
	<title>{work.short} · {universe.name}</title>
</svelte:head>

<header class="pt-6">
	<Button.Root
		href={href(`/${data.slug}`)}
		class="-ml-2 inline-flex h-10 items-center gap-1 rounded-full pr-3 pl-1.5 text-[14px] font-semibold text-muted transition-colors hover:text-ink"
	>
		<Icon name="back" size={20} />{m.universe_title()}
	</Button.Root>

	<div class="mt-5 flex items-start gap-4">
		{#if data.poster}
			<img
				src={data.poster}
				alt=""
				class="h-28 w-[76px] shrink-0 rounded-lg object-cover ring-1 ring-hairline"
			/>
		{/if}
		<div>
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
		</div>
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
							delay={0.2 + i * 0.05}
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
