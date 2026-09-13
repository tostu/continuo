<script lang="ts">
	import { onMount } from 'svelte';
	import { scaleLinear } from 'd3-scale';
	import { toneVar } from '$lib/universe/derive';
	import { reducedMotion, useGsap } from '$lib/motion/gsap';
	import type { Arc, PlotPoint, Work } from '$lib/universe/types';

	let { points, arcs, work }: { points: PlotPoint[]; arcs: Arc[]; work: Work } = $props();

	const PAD = 12;
	const DOT_GAP = 16;
	let width = $state(335);
	let svg: SVGSVGElement;

	const x = $derived(
		scaleLinear()
			.domain(work.range)
			.range([PAD, width - PAD])
	);
	const toneOf = (arcId: string) => arcs.find((a) => a.id === arcId)?.tone ?? 'neutral';

	// Punkte mit gleicher Position leicht versetzen, damit keiner verdeckt wird.
	const xs = $derived(
		points.reduce<number[]>((acc, p) => {
			const prev = acc.at(-1);
			acc.push(prev === undefined ? x(p.at) : Math.max(x(p.at), prev + DOT_GAP));
			return acc;
		}, [])
	);

	onMount(() => {
		if (reducedMotion()) return;
		const { gsap } = useGsap();
		// `stagger.amount` verteilt die Staffelung über ein festes Fenster: eine Figur mit zehn
		// Plot Points ist genauso schnell durch wie eine mit dreien – sonst tröpfeln die Punkte
		// noch, wenn längst die nächste Figur angetippt wurde.
		const tl = gsap.timeline({ delay: 0.12 });
		tl.from(svg.querySelectorAll('[data-dot]'), {
			scale: 0,
			transformOrigin: '50% 50%',
			duration: 0.4,
			ease: 'back.out(3)',
			stagger: { amount: 0.45 }
		});
		// Bei nur einem Plot Point gibt es keine Verbindungsstücke – GSAP würde sonst warnen.
		const segments = svg.querySelectorAll('[data-seg]');
		if (segments.length)
			tl.from(
				segments,
				{
					drawSVG: '0%',
					duration: 0.25,
					ease: 'none',
					stagger: { amount: 0.45 },
					clearProps: 'strokeDasharray,strokeDashoffset'
				},
				0.15
			);
		return () => tl.kill();
	});
</script>

<div bind:clientWidth={width}>
	<svg bind:this={svg} {width} height="28" class="block overflow-visible" aria-hidden="true">
		<line
			x1={PAD}
			x2={width - PAD}
			y1="14"
			y2="14"
			stroke="var(--color-raised)"
			stroke-width="8"
			stroke-linecap="round"
		/>
		{#each points as p, i (p.id)}
			{#if i > 0}
				<line
					data-seg
					x1={xs[i - 1]}
					x2={xs[i]}
					y1="14"
					y2="14"
					stroke={toneVar(toneOf(p.arcId))}
					stroke-width="8"
				/>
			{/if}
		{/each}
		{#each points as p, i (p.id)}
			<circle
				data-dot
				cx={xs[i]}
				cy="14"
				r="10"
				fill={toneVar(toneOf(p.arcId))}
				stroke="var(--color-ground)"
				stroke-width="3"
			/>
		{/each}
	</svg>
	<div class="mt-2 flex justify-between text-[13px] text-muted tabular-nums">
		<span>{work.unit} {work.range[0]}</span>
		<span>{work.unit} {work.range[1]}</span>
	</div>
</div>
