<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import { scaleSqrt } from 'd3-scale';
	import Avatar from './Avatar.svelte';
	import ModeToggle from './ModeToggle.svelte';
	import { arcShares, toneVar } from '$lib/universe/derive';
	import {
		figureTrace,
		rowTitle,
		spanTitle,
		workRuns,
		type TraceRow
	} from '$lib/universe/figure-trace';
	import {
		placementLoreDate,
		placementReleased,
		placementSagaId,
		placementTitle,
		type Placement
	} from '$lib/universe/placements';
	import type { RailMode } from '$lib/universe/rail-layout';
	import type { Character, Universe } from '$lib/universe/types';
	import { reducedMotion, useGsap } from '$lib/motion/gsap';
	import { href } from '$lib/nav';
	import { m } from '$lib/paraglide/messages.js';

	let {
		universe,
		slug,
		character
	}: {
		universe: Universe;
		/** URL-Segment des Universums. */
		slug: string;
		/** Auftritt, dessen Seite gerade offen ist. */
		character: Character;
	} = $props();

	let mode = $state<RailMode>('chronology');
	const modes: { value: RailMode; label: string }[] = [
		{ value: 'chronology', label: m.mode_chronology() },
		{ value: 'saga', label: m.mode_saga() }
	];

	const trace = $derived(figureTrace(universe, character.figureId, mode));
	const sagaName = $derived(new Map(universe.sagas.map((s) => [s.id, s.name])));
	const present = $derived(trace.slots.filter((s) => s.present));
	/** Page-Data kommt getrennt serialisiert an – Vergleich über Schlüssel, nicht Identität. */
	const isHere = (c: Character | undefined) => c?.workSlug === character.workSlug;
	const here = $derived(trace.rows.find((r) => isHere(r.character)));
	const rowKey = (row: TraceRow) => row.slots[0].placement.slug;
	/** Wie im Zeitstrahl: Saga-Modus zeigt das Datum der Handlung, sonst das Erscheinungsjahr. */
	const dateOf = (p: Placement) =>
		mode === 'chronology' ? placementLoreDate(p) : placementReleased(p).slice(0, 4);
	/** Kurze Lücken werden benannt, lange nach Werken gezählt – nicht nach Staffeln. */
	function gapLabel(skipped: Placement[]) {
		if (workRuns(skipped).length <= 2) return m.trace_gap_named({ titles: spanTitle(skipped) });
		const works = new Set(skipped.map((p) => p.work.slug)).size;
		return works === 1 ? m.trace_gap_one() : m.trace_gap_other({ count: works });
	}

	// Barcode: eine Spalte pro Platzierung des Universums.
	const BAR_AREA = 64;
	const STUB = 8;
	const BAND_Y = BAR_AREA + 7;
	let width = $state(335);
	const column = $derived(width / Math.max(trace.slots.length, 1));
	const barWidth = $derived(Math.max(2, Math.min(14, column * 0.6)));
	const barHeight = $derived(
		scaleSqrt()
			.domain([0, Math.max(1, ...trace.slots.map((s) => s.count))])
			.range([16, BAR_AREA - 12])
	);
	const heightOf = (count: number, isPresent: boolean) => (isPresent ? barHeight(count) : STUB);

	let root: HTMLElement;
	let list = $state<HTMLOListElement>();
	let intro: { progress: (value: number) => { kill: () => void }; kill: () => void } | undefined;
	let flipState: ReturnType<ReturnType<typeof useGsap>['Flip']['getState']> | null = null;

	// Die Spur liegt am Seitenende: das Intro startet erst, wenn sie ins Bild kommt.
	onMount(() => {
		if (reducedMotion()) return;
		const { gsap } = useGsap();
		const bars = () => root.querySelectorAll('[data-bar]');
		const rows = () => root.querySelectorAll('[data-flip-id]');
		gsap.set(bars(), { scaleY: 0, transformOrigin: '50% 100%' });
		gsap.set(rows(), { opacity: 0, y: 16 });

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();
				const tl = gsap.timeline({
					onComplete: () => {
						gsap.set([...bars(), ...rows()], { clearProps: 'transform,opacity' });
						intro = undefined;
					}
				});
				tl.to(bars(), {
					scaleY: 1,
					duration: 0.5,
					ease: 'power3.out',
					stagger: { amount: 0.6 }
				});
				tl.to(
					rows(),
					{ opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: { amount: 0.5 } },
					0.25
				);
				intro = tl;
			},
			{ threshold: 0.15 }
		);
		observer.observe(root);
		return () => {
			observer.disconnect();
			intro?.kill();
		};
	});

	// Flip: Zeilenpositionen vor dem Moduswechsel merken, nach dem DOM-Update animieren.
	$effect.pre(() => {
		void mode;
		untrack(() => {
			if (!list || reducedMotion()) return;
			// Ein laufendes Intro würde gegen Flip arbeiten: erst fertigstellen, dann messen.
			intro?.progress(1).kill();
			intro = undefined;
			flipState = useGsap().Flip.getState(list.querySelectorAll('[data-flip-id]'));
		});
	});

	$effect(() => {
		void trace;
		untrack(() => {
			if (!flipState || !list) return;
			const { gsap, Flip } = useGsap();
			const state = flipState;
			flipState = null;
			Flip.from(state, {
				targets: list.querySelectorAll('[data-flip-id]'),
				duration: 0.6,
				ease: 'power3.inOut',
				onEnter: (els) =>
					gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.35, delay: 0.25 })
			});
		});
	});
</script>

{#snippet rowBody(row: TraceRow)}
	{@const first = row.slots[0].placement}
	<span
		class="block text-[11px] font-semibold tracking-[0.14em] uppercase"
		style:color={toneVar(row.tone)}
	>
		{sagaName.get(placementSagaId(first))} · {dateOf(first)}
	</span>
	<span class="mt-0.5 block text-[16px] leading-tight font-semibold text-ink">{rowTitle(row)}</span>
	<span class="mt-1 block text-[13px] text-muted">
		{#if row.character.name !== trace.figure.name}
			<span class="font-serif text-ink italic">{m.trace_alias({ name: row.character.name })}</span>
			·
		{/if}
		{m.plot_points_count({ count: row.count })}
	</span>
{/snippet}

<section
	bind:this={root}
	id="spur"
	aria-labelledby="spur-title"
	class="scroll-mt-8 border-t border-hairline pt-10 pb-14"
>
	<h2 id="spur-title" class="text-[30px] leading-[1.05] font-bold tracking-[-0.025em]">
		{m.trace_heading()}
	</h2>
	{#if trace.works > 1}
		<p class="mt-3 font-serif text-[17px] leading-snug text-muted">
			{m.trace_summary({
				figure: trace.figure.name,
				count: trace.works,
				total: trace.totalWorks,
				universe: universe.name
			})}
		</p>
	{/if}

	{#if trace.works > 1 && present.length}
		<dl class="mt-8 grid grid-cols-[auto_auto_1fr] items-end gap-x-6">
			<div class="flex flex-col-reverse">
				<dt class="mt-1.5 text-[12.5px] text-muted">{m.trace_works()}</dt>
				<dd
					class="text-[44px] leading-[0.85] font-bold tracking-tight tabular-nums"
					style:color={toneVar(here?.tone ?? 'arc-1')}
				>
					{trace.works}<span class="text-[20px] font-semibold text-muted">/{trace.totalWorks}</span>
				</dd>
			</div>
			<div class="flex flex-col-reverse">
				<dt class="mt-1.5 text-[12.5px] text-muted">{m.trace_points()}</dt>
				<dd class="text-[44px] leading-[0.85] font-bold tracking-tight tabular-nums">
					{trace.points}
				</dd>
			</div>
			<div class="flex min-w-0 flex-col-reverse">
				<dt class="mt-1.5 text-[12.5px] text-muted">{m.trace_span()}</dt>
				<dd class="text-[15px] leading-tight font-semibold">
					{dateOf(present[0].placement)}<br /><span class="text-muted">→</span>
					{dateOf(present.at(-1)!.placement)}
				</dd>
			</div>
		</dl>
	{/if}

	<div class="mt-8">
		<ModeToggle bind:value={mode} options={modes} label={m.mode_label()} />
	</div>

	<div class="mt-7" bind:clientWidth={width}>
		<svg
			{width}
			height={BAND_Y + 4}
			class="block overflow-visible"
			role="img"
			aria-label={m.trace_barcode_label({
				universe: universe.name,
				figure: trace.figure.name,
				count: present.length,
				total: trace.slots.length
			})}
		>
			<line
				x1="0"
				x2={width}
				y1={BAR_AREA + 0.5}
				y2={BAR_AREA + 0.5}
				stroke="var(--color-hairline)"
			/>
			{#each trace.slots as slot, i (slot.placement.slug)}
				{@const h = heightOf(slot.count, slot.present)}
				<g
					class="transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
					style:transform="translateX({i * column + column / 2}px)"
					style:transition-delay="{(i / trace.slots.length) * 250}ms"
				>
					<rect
						data-bar
						x={-barWidth / 2}
						y={BAR_AREA - h}
						width={barWidth}
						height={h}
						rx={Math.min(barWidth / 2, 3)}
						fill={slot.present ? toneVar(slot.tone) : 'var(--color-raised)'}
					>
						{#if slot.present}
							<title>
								{placementTitle(slot.placement)} · {m.plot_points_count({ count: slot.count })}
							</title>
						{/if}
					</rect>
					{#if slot.present && isHere(slot.character)}
						<circle cy={BAR_AREA - h - 7} r="3" fill="var(--color-ink)" />
					{/if}
				</g>
			{/each}
			{#key mode}
				<g in:fade={{ duration: reducedMotion() ? 0 : 400, delay: 200 }}>
					{#each trace.bands as band (band.id)}
						<rect
							x={band.from * column + 1}
							y={BAND_Y}
							width={Math.max((band.to - band.from + 1) * column - 2, 1)}
							height="4"
							rx="2"
							fill={toneVar(band.tone)}
							opacity="0.6"
						/>
					{/each}
				</g>
			{/key}
		</svg>
		<div class="mt-2 flex justify-between gap-4 text-[12.5px] text-muted tabular-nums">
			<span>{dateOf(trace.slots[0].placement)}</span>
			<span class="text-right">{dateOf(trace.slots.at(-1)!.placement)}</span>
		</div>
	</div>

	{#if trace.works > 1}
		<ol bind:this={list} class="mt-8 flex flex-col">
			{#each trace.rows as row, i (rowKey(row))}
				{#if row.skipped.length}
					<li data-flip-id="gap-{rowKey(row)}" class="relative py-1 pl-[68px]">
						<span
							aria-hidden="true"
							class="absolute top-0 bottom-0 left-[25px] border-l-2 border-dashed border-neutral"
						></span>
						<span class="text-[12.5px] text-muted">
							{gapLabel(row.skipped)}
						</span>
					</li>
				{/if}
				<li data-flip-id={rowKey(row)} class="relative py-1.5">
					<span
						aria-hidden="true"
						class="absolute left-[25px] w-0.5"
						style:top={i === 0 ? '50%' : '0'}
						style:bottom={i === trace.rows.length - 1 ? '50%' : '0'}
						style:background={toneVar(row.tone)}
					></span>
					{#if isHere(row.character)}
						<div class="relative flex items-center gap-4">
							<span class="rounded-full bg-ground">
								<Avatar
									initials={row.character.initials}
									photoUrl={row.character.photo}
									shares={arcShares(universe, row.work.slug, row.character.id)}
									size={52}
								/>
							</span>
							<div class="min-w-0 flex-1 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-hairline">
								<span
									class="float-right ml-2 rounded-full bg-ink px-2 py-0.5 text-[10.5px] font-semibold text-ground"
								>
									{m.trace_here()}
								</span>
								{@render rowBody(row)}
							</div>
						</div>
					{:else}
						<a
							href={href(`/${slug}/werk/${row.work.slug}/figur/${row.character.id}`)}
							class="group relative flex items-center gap-4 rounded-2xl focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
						>
							<span
								class="rounded-full bg-ground transition-[scale] duration-200 group-hover:scale-105"
							>
								<Avatar
									initials={row.character.initials}
									photoUrl={row.character.photo}
									shares={arcShares(universe, row.work.slug, row.character.id)}
									size={52}
								/>
							</span>
							<div
								class="min-w-0 flex-1 rounded-2xl px-3.5 py-3 transition-colors group-hover:bg-surface"
							>
								{@render rowBody(row)}
							</div>
						</a>
					{/if}
				</li>
			{/each}
		</ol>
	{:else}
		<p
			class="mt-8 rounded-[20px] bg-card p-5 font-serif text-[19px] leading-snug ring-1 ring-hairline"
		>
			{m.trace_only_here({ work: trace.rows[0].work.title })}
		</p>
	{/if}
</section>
