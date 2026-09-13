<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import { linkVertical } from 'd3-shape';
	import { Tooltip } from 'bits-ui';
	import Icon from './Icon.svelte';
	import { layoutRail, type RailMode, type RailNode } from '$lib/universe/rail-layout';
	import { toneVar, year } from '$lib/universe/derive';
	import type { Tone, Universe, Work } from '$lib/universe/types';
	import { reducedMotion, useGsap } from '$lib/motion/gsap';
	import { href } from '$lib/nav';
	import { m } from '$lib/paraglide/messages.js';

	let {
		universe,
		slug,
		mode
	}: { universe: Universe; /** URL-Segment des Universums. */ slug: string; mode: RailMode } =
		$props();

	let width = $state(335);
	let root: HTMLDivElement;

	const layout = $derived(layoutRail(universe, mode, width));
	const nodeBySlug = $derived(new Map(layout.nodes.map((n) => [n.slug, n])));
	const workBySlug = $derived(new Map(universe.works.map((w) => [w.slug, w])));
	const link = linkVertical();

	const edgeColor = (tone: Tone) => (tone === 'neutral' ? 'var(--color-neutral)' : toneVar(tone));
	/** Chronology-Modus zeigt das Datum der Handlung, sonst das Erscheinungsjahr. */
	const dateLabel = (work: Work) => (mode === 'chronology' ? work.loreDate : year(work));
	/** Svelte-Transitions respektieren reduced motion nicht von selbst. */
	const motion = (params: { delay?: number; duration: number }) =>
		reducedMotion() ? { duration: 0 } : params;

	// Animierte Knotenpositionen: Pfade werden aus diesen Werten abgeleitet und morphen dadurch mit.
	const pos = $state<Record<string, { x: number; y: number }>>({});
	const tweens: Record<string, { kill: () => void }> = {};
	let lastMode: RailMode | undefined;
	/** Knotenmenge des letzten Layouts – ändert sie sich (Filter), wird ebenfalls getweent. */
	let lastSlugs = '';

	const at = (node: RailNode) => pos[node.slug] ?? node;

	$effect(() => {
		const { nodes } = layout;
		const slugs = nodes.map((n) => n.slug).join(',');
		const animate =
			lastMode !== undefined && (lastMode !== mode || lastSlugs !== slugs) && !reducedMotion();
		lastMode = mode;
		lastSlugs = slugs;
		const { gsap } = useGsap();

		nodes.forEach((node, i) => {
			tweens[node.slug]?.kill();
			const current = untrack(() => pos[node.slug]);
			if (!animate || !current) {
				pos[node.slug] = { x: node.x, y: node.y };
				return;
			}
			const p = { ...current };
			tweens[node.slug] = gsap.to(p, {
				x: node.x,
				y: node.y,
				duration: 0.85,
				delay: i * 0.025,
				ease: 'power3.inOut',
				onUpdate: () => {
					pos[node.slug] = { x: p.x, y: p.y };
				}
			});
		});
	});

	onMount(() => {
		if (reducedMotion()) return;
		const { gsap } = useGsap();
		const q = (selector: string) => root.querySelectorAll(selector);

		const tl = gsap.timeline();
		// clearProps gibt Tailwinds translate/scale-Klassen (Zentrierung, Hover) nach dem Intro wieder frei.
		const release = 'transform,translate,rotate,scale,opacity';
		tl.from(
			q('[data-banner]'),
			{
				opacity: 0,
				y: -10,
				scale: 0.9,
				duration: 0.5,
				ease: 'power3.out',
				stagger: 0.45,
				clearProps: release
			},
			0
		);
		tl.from(
			q('[data-edge]:not([data-dashed])'),
			{
				drawSVG: '0%',
				duration: 0.26,
				ease: 'none',
				stagger: 0.12,
				clearProps: 'strokeDasharray,strokeDashoffset'
			},
			0.1
		);
		tl.from(
			q('[data-node-body]'),
			{ scale: 0, duration: 0.55, ease: 'back.out(2.4)', stagger: 0.1, clearProps: release },
			0.05
		);
		tl.from(
			q('[data-node-label]'),
			{ opacity: 0, y: 6, duration: 0.4, ease: 'power2.out', stagger: 0.1, clearProps: release },
			0.2
		);
		tl.from(q('[data-dashed]'), { opacity: 0, duration: 0.5, stagger: 0.1 }, 1);

		const pulse = gsap.to(q('[data-pulse]'), {
			scale: 1.45,
			opacity: 0,
			duration: 1.8,
			ease: 'power2.out',
			repeat: -1
		});

		return () => {
			tl.kill();
			pulse.kill();
			Object.values(tweens).forEach((t) => t.kill());
		};
	});
</script>

<div
	bind:this={root}
	bind:clientWidth={width}
	class="relative transition-[height] duration-700 motion-reduce:transition-none"
	style:height="{layout.height}px"
>
	<svg class="absolute inset-0 overflow-visible" {width} height={layout.height} aria-hidden="true">
		{#each layout.edges as edge (edge.id)}
			{@const a = at(nodeBySlug.get(edge.from)!)}
			{@const b = at(nodeBySlug.get(edge.to)!)}
			<path
				data-edge
				data-dashed={edge.dashed || undefined}
				d={link({ source: [a.x, a.y], target: [b.x, b.y] })}
				fill="none"
				stroke={edgeColor(edge.tone)}
				stroke-width={edge.branch ? 3 : 4}
				stroke-linecap="round"
				stroke-dasharray={edge.dashed ? '0.5 8' : undefined}
				in:fade={motion({ delay: 500, duration: 350 })}
				out:fade={motion({ duration: 150 })}
			/>
		{/each}
	</svg>

	{#each layout.banners as banner (banner.id)}
		<div
			data-banner
			class="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-1.5 text-[12px] font-bold tracking-[0.16em] whitespace-nowrap uppercase"
			class:text-white={banner.tone !== 'neutral'}
			class:text-ink={banner.tone === 'neutral'}
			class:ring-1={banner.tone === 'neutral'}
			class:ring-hairline={banner.tone === 'neutral'}
			style:left="{banner.x}px"
			style:top="{banner.y}px"
			style:background-color={banner.tone === 'neutral'
				? 'var(--color-raised)'
				: toneVar(banner.tone)}
			in:fade={motion({ delay: 250, duration: 300 })}
			out:fade={motion({ duration: 150 })}
		>
			{banner.label}
		</div>
	{/each}

	{#each layout.nodes as node (node.slug)}
		{@const work = workBySlug.get(node.slug)!}
		{@const p = at(node)}
		<div class="absolute z-20" style:left="{p.x}px" style:top="{p.y}px">
			{#if work.nowPlaying}
				<span
					data-pulse
					class="pointer-events-none absolute rounded-full border-2"
					style:border-color={toneVar(node.tone)}
					style:inset="{-node.r - 7}px"
				></span>
				<span
					class="pointer-events-none absolute rounded-full border-2"
					style:border-color={toneVar(node.tone)}
					style:inset="{-node.r - 7}px"
				></span>
				<span
					data-node-label
					class="absolute flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ring-1 ring-hairline"
					style:top="{-node.r - 38}px"
					style:color={toneVar(node.tone)}
				>
					<Icon name="play" size={10} />{m.now_playing()}
				</span>
			{/if}

			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<a
							{...props}
							data-node-body
							href={href(`/${slug}/werk/${work.slug}`)}
							aria-label={work.title}
							class="absolute grid place-items-center overflow-hidden rounded-full transition-[scale] duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ground focus-visible:outline-none"
							class:border-2={node.optional}
							class:border-dashed={node.optional}
							class:bg-ground={node.optional && !work.cover}
							class:text-white={!node.optional}
							style:width="{node.r * 2}px"
							style:height="{node.r * 2}px"
							style:left="{-node.r}px"
							style:top="{-node.r}px"
							style:background-color={node.optional || work.cover ? undefined : toneVar(node.tone)}
							style:border-color={node.optional ? toneVar(node.tone) : undefined}
							style:color={node.optional ? toneVar(node.tone) : undefined}
						>
							{#if work.cover}
								<img
									src={work.cover}
									alt=""
									class="h-full w-full object-cover"
									class:opacity-60={node.optional}
									loading="lazy"
								/>
								<span
									class="pointer-events-none absolute right-0 bottom-0 grid place-items-center rounded-full ring-2 ring-ground"
									style:width="{Math.max(node.r * 0.62, 14)}px"
									style:height="{Math.max(node.r * 0.62, 14)}px"
									style:background-color={toneVar(node.tone)}
									style:color="white"
								>
									<Icon
										name={work.kind === 'film' ? 'film' : 'tv'}
										size={Math.max(node.r * 0.34, 9)}
									/>
								</span>
							{:else}
								<Icon name={work.kind === 'film' ? 'film' : 'tv'} size={node.optional ? 13 : 20} />
							{/if}
						</a>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						sideOffset={10}
						class="z-50 max-w-60 rounded-2xl bg-raised px-3.5 py-2.5 text-[13px] text-ink shadow-xl ring-1 ring-hairline"
					>
						<p class="font-semibold">{work.title}</p>
						<p class="mt-0.5 text-muted">
							{dateLabel(work)} · {work.kind === 'film' ? m.kind_film() : m.kind_series()} ·
							{work.required ? m.required() : m.optional()}
						</p>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			{#key node.labelSide}
				<span
					data-node-label
					class={[
						'pointer-events-none absolute leading-tight whitespace-nowrap',
						node.labelSide === 'below' ? '-translate-x-1/2 text-center' : '-translate-y-1/2',
						node.labelSide === 'left' && 'text-right'
					]}
					style:left={node.labelSide === 'right'
						? `${node.r + 12}px`
						: node.labelSide === 'below'
							? '0px'
							: undefined}
					style:right={node.labelSide === 'left' ? `${node.r + 12}px` : undefined}
					style:top={node.labelSide === 'below' ? `${node.r + 6}px` : '0px'}
					in:fade={motion({ duration: 250, delay: 450 })}
				>
					{#if node.optional}
						<span class="block text-[11.5px] font-medium text-muted">{work.short}</span>
					{:else}
						<span class="block text-[14px] font-semibold text-ink">{work.short}</span>
						<span class="block text-[11.5px] text-muted">
							{dateLabel(work)} · {work.kind === 'film' ? m.kind_film() : m.kind_series()}
						</span>
					{/if}
				</span>
			{/key}
		</div>
	{/each}
</div>
