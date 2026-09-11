<script lang="ts">
	import ArcBadge from './ArcBadge.svelte';
	import type { Arc, PlotPoint, Work } from '$lib/universe/types';

	let { point, arc, unit }: { point: PlotPoint; arc: Arc; unit: Work['unit'] } = $props();
</script>

<article class="rounded-[20px] bg-card p-5 ring-1 ring-hairline">
	<div class="flex items-center justify-between gap-3">
		<ArcBadge name={arc.name} tone={arc.tone} />
		<span class="text-sm text-muted tabular-nums">{unit} {point.at}</span>
	</div>
	<p class="mt-3 font-serif text-[19px] leading-snug text-ink">{point.text}</p>
</article>
