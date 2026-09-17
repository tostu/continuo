<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Avatar from './Avatar.svelte';
	import Icon from './Icon.svelte';
	import PlotTimeline from './PlotTimeline.svelte';
	import { toneVar, year } from '$lib/universe/derive';
	import type { ZoomModel } from '$lib/universe/types';
	import { m } from '$lib/paraglide/messages.js';

	/**
	 * Drei Zoomstufen am Beispiel Star Wars → Episode IV → eine Figur.
	 * Keile verbinden das markierte Element einer Stufe mit der nächsten Stufe, wie eine Lupe.
	 *
	 * Die Daten kommen zugeschnitten aus dem Server-Load (`zoomModel` in +page.server.ts) –
	 * die Universen liegen in D1 und werden beim Prerendering gelesen.
	 */
	let { zoom }: { zoom: ZoomModel } = $props();

	const work = $derived(zoom.work);
	const arcs = $derived(zoom.arcs);
	const railWorks = $derived(zoom.railWorks);
	const cast = $derived(zoom.cast);
	const workTone = $derived(railWorks.find((r) => r.work.slug === work.slug)?.tone ?? 'neutral');

	// Ohne Klick steht die erste Figur – deshalb `undefined` statt einer Startkopie aus `zoom`.
	let picked = $state<string>();
	const selected = $derived(cast.find((c) => c.character.id === picked) ?? cast[0]);
	const selectedId = $derived(selected.character.id);
	const points = $derived(selected.points);
	const arcTone = (arcId: string) => arcs.find((a) => a.id === arcId)?.tone ?? 'neutral';

	let stage: HTMLOListElement;
	let size = $state({ width: 0, height: 0 });
	let wedges = $state<string[]>([]);

	/** Keil von der markierten Zeile zur rechten Nachbarstufe; untereinander (mobil) gibt es keine. */
	function measure() {
		const base = stage.getBoundingClientRect();
		size = { width: base.width, height: base.height };
		const pairs = [
			['[data-zoom-from="universe"]', '[data-panel="work"]'],
			['[data-zoom-from="work"]', '[data-panel="scene"]']
		];
		const next: string[] = [];
		for (const [from, to] of pairs) {
			const s = stage.querySelector(from)?.getBoundingClientRect();
			const t = stage.querySelector(to)?.getBoundingClientRect();
			if (!s || !t || t.left < s.right) {
				wedges = [];
				return;
			}
			const x = (v: number) => v - base.left;
			const y = (v: number) => v - base.top;
			next.push(
				`${x(s.right)},${y(s.top)} ${x(t.left)},${y(t.top)} ${x(t.left)},${y(t.bottom)} ${x(s.right)},${y(s.bottom)}`
			);
		}
		wedges = next;
	}

	$effect(() => {
		void selectedId;
		tick().then(measure);
	});

	onMount(() => {
		const ro = new ResizeObserver(measure);
		ro.observe(stage);
		stage.querySelectorAll('[data-panel]').forEach((panel) => ro.observe(panel));
		document.fonts.ready.then(measure);
		return () => ro.disconnect();
	});
</script>

<ol
	bind:this={stage}
	class="relative mt-12 grid grid-cols-1 gap-y-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-6"
>
	{#if wedges.length}
		<svg
			width={size.width}
			height={size.height}
			class="pointer-events-none absolute inset-0 hidden lg:block"
			aria-hidden="true"
		>
			{#each wedges as points, i (i)}
				<polygon
					{points}
					class="fill-ink stroke-neutral"
					fill-opacity="0.05"
					stroke-width="1"
					stroke-linejoin="round"
				/>
			{/each}
		</svg>
	{/if}

	<li class="relative flex flex-col gap-5 lg:row-span-2 lg:grid lg:grid-rows-subgrid lg:gap-0">
		<div>
			<h3 class="text-[20px] font-bold tracking-tight">{m.zoom_universe_title()}</h3>
			<p class="mt-2 font-serif text-[16px] leading-[1.55] text-muted">
				{m.zoom_universe_text()}
			</p>
		</div>
		<div data-panel="universe" class="rounded-2xl bg-surface p-3 ring-1 ring-hairline">
			<p class="px-2 pt-1 text-[13px] font-semibold">{zoom.universeName}</p>
			<ol class="relative mt-2" aria-hidden="true">
				<span class="absolute top-6 bottom-6 left-[27px] w-0.5 bg-hairline"></span>
				{#each railWorks as { work: w, tone } (w.slug)}
					<li
						data-zoom-from={w.slug === work.slug ? 'universe' : undefined}
						class="relative flex items-center gap-3 rounded-xl px-2 py-1.5 {w.slug === work.slug
							? 'bg-raised ring-1 ring-neutral'
							: ''}"
					>
						<span
							class="grid h-[42px] w-7 shrink-0 place-items-center rounded text-white"
							style:background-color={toneVar(tone)}
							style:box-shadow="0 0 0 2px var(--color-surface), 0 0 0 4px {toneVar(tone)}"
						>
							<Icon name={w.kind === 'film' ? 'film' : 'tv'} size={13} />
						</span>
						<span
							class="min-w-0 flex-1 truncate text-[13px] {w.required
								? 'font-semibold'
								: 'text-muted'}">{w.short}</span
						>
						<span class="text-[12px] text-muted tabular-nums">{year(w)}</span>
					</li>
				{/each}
			</ol>
		</div>
	</li>

	<li class="relative flex flex-col gap-5 lg:row-span-2 lg:grid lg:grid-rows-subgrid lg:gap-0">
		<div>
			<h3 class="text-[20px] font-bold tracking-tight">{m.zoom_work_title()}</h3>
			<p class="mt-2 font-serif text-[16px] leading-[1.55] text-muted">{m.zoom_work_text()}</p>
		</div>
		<div data-panel="work" class="rounded-2xl bg-surface p-5 ring-1 ring-hairline">
			<div class="flex items-center gap-3">
				<span
					class="grid aspect-[2/3] w-11 shrink-0 place-items-center rounded-md text-white"
					style:background-color={toneVar(workTone)}
				>
					<Icon name={work.kind === 'film' ? 'film' : 'tv'} size={18} />
				</span>
				<div class="min-w-0">
					<p class="text-[15px] leading-tight font-bold">{work.title}</p>
					<p class="mt-1 text-[12px] text-muted">
						{work.kind === 'film' ? m.kind_film() : m.kind_series()}, {work.range[1]}
						{work.unit}
					</p>
				</div>
			</div>

			<ul class="mt-5 grid grid-cols-3 gap-x-1 gap-y-2">
				{#each cast as { character, shares } (character.id)}
					{@const isSelected = character.id === selectedId}
					<li>
						<button
							type="button"
							data-zoom-from={isSelected ? 'work' : undefined}
							aria-pressed={isSelected}
							onclick={() => (picked = character.id)}
							class="flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-ink {isSelected
								? 'bg-raised ring-1 ring-neutral'
								: 'hover:bg-raised/60'}"
						>
							<Avatar initials={character.initials} photoUrl={character.photo} {shares} size={56} />
							<span class="text-[11.5px] leading-tight {isSelected ? 'text-ink' : 'text-muted'}">
								{character.name}
							</span>
						</button>
					</li>
				{/each}
			</ul>

			<ul class="mt-4 flex flex-wrap gap-x-4 gap-y-1">
				{#each arcs as arc (arc.id)}
					<li class="inline-flex items-center gap-1.5 text-[12px] text-muted">
						<span class="size-2 rounded-full" style:background-color={toneVar(arc.tone)}></span>
						{arc.name}
					</li>
				{/each}
			</ul>
			<p class="mt-4 text-[12px] text-muted">{m.zoom_pick_hint()}</p>
		</div>
	</li>

	<li class="relative flex flex-col gap-5 lg:row-span-2 lg:grid lg:grid-rows-subgrid lg:gap-0">
		<div>
			<h3 class="text-[20px] font-bold tracking-tight">{m.zoom_scene_title()}</h3>
			<p class="mt-2 font-serif text-[16px] leading-[1.55] text-muted">{m.zoom_scene_text()}</p>
		</div>
		<div
			data-panel="scene"
			class="min-w-0 rounded-2xl bg-surface p-5 ring-1 ring-hairline"
			aria-live="polite"
		>
			{#key selectedId}
				<div class="flex items-center gap-4">
					<Avatar
						initials={selected.character.initials}
						photoUrl={selected.character.photo}
						shares={selected.shares}
						size={76}
					/>
					<div class="min-w-0">
						<p class="text-[18px] leading-tight font-bold">{selected.character.name}</p>
						<p class="mt-1 text-[12.5px] text-muted">
							{m.plot_points_count({ count: points.length })}
						</p>
					</div>
				</div>
				<div class="mt-5">
					<PlotTimeline {points} {arcs} {work} />
				</div>
				<ol class="mt-4 space-y-3">
					{#each points as point (point.id)}
						<li class="grid grid-cols-[3.75rem_1fr] gap-2 text-[13px] leading-snug">
							<span class="font-semibold tabular-nums" style:color={toneVar(arcTone(point.arcId))}>
								{m.minute_short({ at: point.at })}
							</span>
							<span class="text-ink/85">{point.text}</span>
						</li>
					{/each}
				</ol>
			{/key}
		</div>
	</li>
</ol>
