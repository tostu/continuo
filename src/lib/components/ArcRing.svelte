<script lang="ts">
	import { onMount } from 'svelte';
	import { arc, pie, type PieArcDatum } from 'd3-shape';
	import { toneVar, type ArcShare } from '$lib/universe/derive';
	import { reducedMotion, useGsap } from '$lib/motion/gsap';

	let {
		shares,
		size,
		thickness = 6,
		delay = 0
	}: { shares: ArcShare[]; size: number; thickness?: number; delay?: number } = $props();

	/** 0 → 1: Segmente wachsen nacheinander ein. */
	const grow = $state({ t: 1 });

	const slices = $derived(
		pie<ArcShare>()
			.value((s) => s.count)
			.sort(null)
			.padAngle(shares.length > 1 ? 0.09 : 0)(shares)
	);
	const outer = $derived(size / 2);
	const shape = $derived(
		arc<PieArcDatum<ArcShare>>()
			.innerRadius(outer - thickness)
			.outerRadius(outer)
			.cornerRadius(thickness / 2)
	);

	function path(slice: PieArcDatum<ArcShare>, index: number) {
		const progress = Math.min(1, Math.max(0, grow.t * slices.length - index));
		if (progress === 0) return '';
		const endAngle = slice.startAngle + (slice.endAngle - slice.startAngle) * progress;
		return shape({ ...slice, endAngle }) ?? '';
	}

	onMount(() => {
		if (reducedMotion()) return;
		const { gsap } = useGsap();
		grow.t = 0;
		const tween = gsap.to(grow, {
			t: 1,
			// Kurz genug, dass der Ring fertig ist, bevor die nächste Figur angetippt wird.
			duration: 0.4 + slices.length * 0.12,
			ease: 'power2.inOut',
			delay
		});
		return () => tween.kill();
	});
</script>

<svg
	width={size}
	height={size}
	viewBox="{-size / 2} {-size / 2} {size} {size}"
	class="pointer-events-none absolute inset-0 -rotate-0"
	aria-hidden="true"
>
	<circle
		r={outer - thickness / 2}
		fill="none"
		stroke="var(--color-raised)"
		stroke-width={thickness}
	/>
	{#each slices as slice, i (slice.data.arc.id)}
		<path d={path(slice, i)} fill={toneVar(slice.data.arc.tone)} />
	{/each}
</svg>
