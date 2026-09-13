<script lang="ts">
	import { Button } from 'bits-ui';
	import UniverseRail from '$lib/components/UniverseRail.svelte';
	import ModeToggle from '$lib/components/ModeToggle.svelte';
	import KindFilter from '$lib/components/KindFilter.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { RailMode } from '$lib/universe/rail-layout';
	import type { Work } from '$lib/universe/types';
	import { href } from '$lib/nav';
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();

	const universe = $derived(data.universe);

	let mode = $state<RailMode>('chronology');
	// Beide Gattungen sind zu Beginn an; jede lässt sich einzeln abwählen.
	let kinds = $state<Work['kind'][]>(['film', 'serie']);

	const works = $derived(universe.works.filter((w) => kinds.includes(w.kind)));
	const shown = $derived({ ...universe, works });
	const required = $derived(works.filter((w) => w.required).length);

	const modes: { value: RailMode; label: string }[] = [
		{ value: 'chronology', label: m.mode_chronology() },
		{ value: 'saga', label: m.mode_saga() }
	];
</script>

<svelte:head>
	<title>{m.universe_title()} · {universe.name}</title>
</svelte:head>

<header class="pt-6 pb-2">
	<Button.Root
		href={href('/')}
		class="-ml-2 inline-flex h-10 items-center gap-1 rounded-full pr-3 pl-1.5 text-[14px] font-semibold text-muted transition-colors hover:text-ink"
	>
		<Icon name="back" size={20} />{m.all_universes()}
	</Button.Root>

	<p class="mt-5 text-[12px] font-semibold tracking-[0.18em] text-muted uppercase">
		{universe.name}
	</p>
	<h1 class="mt-1 text-[42px] leading-none font-bold tracking-tight">{m.universe_title()}</h1>
	<p class="mt-5 flex items-end gap-3">
		<span class="text-[64px] leading-[0.8] font-bold tracking-tight text-arc-1 tabular-nums">
			{works.length}
		</span>
		<span class="max-w-36 text-[15px] leading-snug text-muted">{m.works_summary({ required })}</span
		>
	</p>
</header>

<main class="mt-4">
	{#if works.length === 0}
		<p class="py-16 text-center text-[15px] text-muted">{m.no_works_kind()}</p>
	{:else}
		{#key data.slug}
			<UniverseRail universe={shown} slug={data.slug} {mode} />
		{/key}

		<div class="flex flex-col items-center gap-2 pt-2 pb-6 text-muted">
			<Icon name="arrow-down" size={18} class="animate-bounce" />
			<p class="text-[13px]">{m.legend()}</p>
		</div>
	{/if}
</main>

<div class="sticky bottom-0 z-30 -mx-5 bg-ground/85 px-5 pt-3 pb-5 backdrop-blur-md">
	<div class="flex items-center gap-2">
		<div class="min-w-0 flex-1">
			<ModeToggle bind:value={mode} options={modes} label={m.mode_label()} />
		</div>
		<KindFilter bind:value={kinds} label={m.kind_filter_label()} />
	</div>
</div>
