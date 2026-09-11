<script lang="ts">
	import UniverseRail from '$lib/components/UniverseRail.svelte';
	import ModeToggle from '$lib/components/ModeToggle.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { starWars } from '$lib/universe/star-wars';
	import type { RailMode } from '$lib/universe/rail-layout';
	import { m } from '$lib/paraglide/messages.js';

	let mode = $state<RailMode>('saga');

	const required = starWars.works.filter((w) => w.required).length;
	const modes: { value: RailMode; label: string }[] = [
		{ value: 'saga', label: m.mode_saga() },
		{ value: 'strang', label: m.mode_strand() },
		{ value: 'pflicht', label: m.mode_required() }
	];
</script>

<svelte:head>
	<title>{m.universe_title()} · {starWars.name}</title>
</svelte:head>

<header class="pt-10 pb-2">
	<p class="text-[12px] font-semibold tracking-[0.18em] text-muted uppercase">{starWars.name}</p>
	<h1 class="mt-1 text-[42px] leading-none font-bold tracking-tight">{m.universe_title()}</h1>
	<p class="mt-5 flex items-end gap-3">
		<span class="text-[64px] leading-[0.8] font-bold tracking-tight text-arc-1 tabular-nums">
			{starWars.works.length}
		</span>
		<span class="max-w-36 text-[15px] leading-snug text-muted">{m.works_summary({ required })}</span
		>
	</p>
</header>

<main class="mt-4">
	<UniverseRail universe={starWars} {mode} />

	<div class="flex flex-col items-center gap-2 pt-2 pb-6 text-muted">
		<Icon name="arrow-down" size={18} class="animate-bounce" />
		<p class="text-[13px]">{m.legend()}</p>
	</div>
</main>

<div class="sticky bottom-0 z-30 -mx-5 bg-ground/85 px-5 pt-3 pb-5 backdrop-blur-md">
	<ModeToggle bind:value={mode} options={modes} label={m.mode_label()} />
</div>
