<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { fade, scale } from 'svelte/transition';
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
	function motion<T extends { duration: number; delay?: number }>(params: T): T {
		return reducedMotion() ? { ...params, duration: 0, delay: 0 } : params;
	}

	/**
	 * Gemeinsame Taktung für Moduswechsel und Filter: Knoten, Höhe, Kanten und Banner laufen im
	 * selben Fenster, damit nichts stehenbleibt, während der Rest noch unterwegs ist.
	 */
	const MORPH = { duration: 0.7, spread: 0.3, ease: 'power3.inOut' };
	/** Intro-Staffelung als Gesamtfenster: die Dauer wächst nicht mit der Zahl der Werke. */
	const INTRO_SPREAD = 0.9;
	const CLEAR = 'transform,translate,rotate,scale,opacity';
	const CLEAR_STROKE = `${CLEAR},strokeDasharray,strokeDashoffset`;

	type Killable = { kill: () => void };

	// Animierte Knotenpositionen: Pfade werden aus diesen Werten abgeleitet und morphen dadurch mit.
	const pos = $state<Record<string, { x: number; y: number }>>({});
	// Die Höhe hängt am selben Tween wie die Knoten statt an einer eigenen CSS-Transition –
	// sonst steht der Container schon, während die unteren Knoten noch wandern.
	const box = $state({ h: 0 });
	let morph: Killable | undefined;
	let grow: Killable | undefined;
	let intro: (Killable & { progress: (value: number) => Killable }) | undefined;
	let started = false;
	let lastMode: RailMode | undefined;
	/** Knotenmenge des letzten Layouts – ändert sie sich (Filter), wird ebenfalls getweent. */
	let lastSlugs = '';

	const at = (node: RailNode) => pos[node.slug] ?? node;

	/**
	 * Setzt ein laufendes Intro sofort auf seinen Endzustand. Ohne das bleiben Knoten, deren
	 * Staffel noch nicht dran war, auf `scale: 0` hängen, wenn man währenddessen umschaltet.
	 */
	function finishIntro() {
		if (!intro) return;
		const { gsap } = useGsap();
		intro.progress(1).kill();
		intro = undefined;
		gsap.set(
			root.querySelectorAll('[data-banner],[data-edge],[data-node-body],[data-node-label]'),
			{ clearProps: CLEAR_STROKE }
		);
	}

	/**
	 * Läuft vor dem DOM-Update: ein noch laufendes Intro muss fertig sein, bevor Svelte die
	 * Aus-Transitions startet. Danach räumt Svelte die Elemente sonst nie ab – GSAP hält sie
	 * mitten in der Staffelung fest und die alten Banner bleiben als Geister stehen.
	 */
	$effect.pre(() => {
		if (layout) untrack(finishIntro);
	});

	$effect(() => {
		const { nodes, height } = layout;
		const currentMode = mode;

		// Alle Zugriffe auf `pos`/`box` ungetrackt: der Tween schreibt hinein, das würde den
		// Effekt sonst endlos neu auslösen.
		untrack(() => {
			const { gsap } = useGsap();
			const slugs = nodes.map((n) => n.slug).join(',');
			const changed = started && (lastMode !== currentMode || lastSlugs !== slugs);
			const animate = changed && !reducedMotion();

			morph?.kill();
			grow?.kill();

			// Verschwundene Knoten vergessen: kommen sie zurück, starten sie am neuen Platz,
			// statt aus einer veralteten Position quer über den Zeitstrahl zu rutschen.
			const live = new Set(nodes.map((n) => n.slug));
			for (const slug of Object.keys(pos)) if (!live.has(slug)) delete pos[slug];

			const entering: string[] = [];
			for (const node of nodes) {
				if (pos[node.slug]) continue;
				pos[node.slug] = { x: node.x, y: node.y };
				if (started) entering.push(node.slug);
			}

			if (animate) {
				const targets = nodes.map((n) => pos[n.slug]);
				morph = gsap.to(targets, {
					x: (i: number) => nodes[i].x,
					y: (i: number) => nodes[i].y,
					duration: MORPH.duration,
					ease: MORPH.ease,
					stagger: { amount: MORPH.spread }
				});
				grow = gsap.to(box, {
					h: height,
					duration: MORPH.duration + MORPH.spread,
					ease: MORPH.ease
				});
			} else {
				for (const node of nodes) Object.assign(pos[node.slug], { x: node.x, y: node.y });
				box.h = height;
			}

			// Neu hinzugekommene Knoten (Filter) poppen an ihrem Platz auf, statt hart zu erscheinen.
			if (entering.length && !reducedMotion()) {
				const els = entering
					.map((s) => root.querySelector(`[data-node="${s}"]`))
					.filter((el) => el !== null);
				if (els.length)
					gsap.from(els, {
						scale: 0,
						opacity: 0,
						duration: 0.45,
						ease: 'back.out(1.8)',
						stagger: { amount: 0.25 },
						clearProps: CLEAR
					});
			}

			started = true;
			lastMode = currentMode;
			lastSlugs = slugs;
		});
	});

	// „Läuft gerade"-Puls hängt an der aktuellen Knotenmenge, damit er auch für Knoten läuft,
	// die erst durch einen Filterwechsel dazukommen.
	$effect(() => {
		const { nodes } = layout;
		if (!nodes.length || reducedMotion()) return;
		const marks = root.querySelectorAll('[data-pulse]');
		if (!marks.length) return;
		const { gsap } = useGsap();
		const pulse = gsap.to(marks, {
			scale: 1.45,
			opacity: 0,
			duration: 1.8,
			ease: 'power2.out',
			repeat: -1
		});
		return () => pulse.kill();
	});

	onMount(() => {
		if (reducedMotion()) return;
		const { gsap } = useGsap();
		const q = (selector: string) => root.querySelectorAll(selector);

		const tl = gsap.timeline({ onComplete: () => (intro = undefined) });
		intro = tl;
		// Leere Auswahl überspringen – GSAP warnt sonst über fehlende Targets (z.B. Banner im
		// Release-Modus oder ein Universum ganz ohne optionale Werke).
		const from = (selector: string, vars: gsap.TweenVars, at: number) => {
			const els = q(selector);
			if (els.length) tl.from(els, vars, at);
		};
		// clearProps gibt Tailwinds translate/scale-Klassen (Zentrierung, Hover) nach dem Intro wieder frei.
		// `stagger.amount` verteilt die Staffelung über ein festes Fenster statt pro Element zu
		// addieren – sonst dauert das Intro bei 27 Werken mehrere Sekunden und der Zeitstrahl
		// ist beim Scrollen noch halb leer.
		from(
			'[data-banner]',
			{
				opacity: 0,
				y: -10,
				scale: 0.9,
				duration: 0.45,
				ease: 'power3.out',
				stagger: { amount: 0.5 },
				clearProps: CLEAR
			},
			0
		);
		from(
			'[data-edge]:not([data-dashed])',
			{
				drawSVG: '0%',
				duration: 0.45,
				ease: 'none',
				stagger: { amount: INTRO_SPREAD },
				clearProps: 'strokeDasharray,strokeDashoffset'
			},
			0.08
		);
		from(
			'[data-node-body]',
			{
				scale: 0,
				duration: 0.5,
				ease: 'back.out(2)',
				stagger: { amount: INTRO_SPREAD },
				clearProps: CLEAR
			},
			0.05
		);
		from(
			'[data-node-label]',
			{
				opacity: 0,
				y: 6,
				duration: 0.35,
				ease: 'power2.out',
				stagger: { amount: INTRO_SPREAD },
				clearProps: CLEAR
			},
			0.25
		);
		from('[data-dashed]', { opacity: 0, duration: 0.45, stagger: { amount: 0.4 } }, 0.7);

		return () => {
			tl.kill();
			morph?.kill();
			grow?.kill();
		};
	});
</script>

<div bind:this={root} bind:clientWidth={width} class="relative" style:height="{box.h}px">
	<svg class="absolute inset-0 overflow-visible" {width} height={box.h} aria-hidden="true">
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
				in:fade={motion({ delay: 220, duration: 320 })}
				out:fade={motion({ duration: 180 })}
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
			in:fade={motion({ delay: 180, duration: 280 })}
			out:fade={motion({ duration: 180 })}
		>
			{banner.label}
		</div>
	{/each}

	{#each layout.nodes as node (node.slug)}
		{@const work = workBySlug.get(node.slug)!}
		{@const p = at(node)}
		<!-- `data-node` findet neu dazugekommene Knoten für den Einblend-Pop. -->
		<div
			data-node={node.slug}
			class="absolute z-20"
			style:left="{p.x}px"
			style:top="{p.y}px"
			out:scale={motion({ duration: 260, start: 0.4 })}
		>
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
					in:fade={motion({ duration: 220, delay: 180 })}
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
