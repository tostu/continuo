<script lang="ts">
	import { Avatar } from 'bits-ui';
	import ArcRing from './ArcRing.svelte';
	import type { ArcShare } from '$lib/universe/derive';

	let {
		initials,
		photoUrl,
		shares,
		size = 84,
		transitionName,
		delay = 0
	}: {
		initials: string;
		photoUrl?: string;
		shares: ArcShare[];
		size?: number;
		transitionName?: string;
		delay?: number;
	} = $props();

	const thickness = $derived(size >= 120 ? 11 : 6);
	const inset = $derived(thickness + Math.round(size * 0.05));
</script>

<div
	class="relative shrink-0"
	style:width="{size}px"
	style:height="{size}px"
	style:view-transition-name={transitionName}
>
	<ArcRing {shares} {size} {thickness} {delay} />
	<Avatar.Root
		class="absolute grid place-items-center overflow-hidden rounded-full bg-raised"
		style="inset: {inset}px"
	>
		{#if photoUrl}
			<Avatar.Image src={photoUrl} alt="" class="h-full w-full object-cover" />
		{/if}
		<Avatar.Fallback
			class="font-display leading-none font-bold tracking-tight text-ink"
			style="font-size: {Math.round(size * 0.24)}px"
		>
			{initials}
		</Avatar.Fallback>
	</Avatar.Root>
</div>
