<script lang="ts">
	import { Button } from 'bits-ui';
	import Icon from '$lib/components/Icon.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import SearchField from '$lib/components/SearchField.svelte';
	import ModeToggle from '$lib/components/ModeToggle.svelte';
	import UniverseListItem from '$lib/components/UniverseListItem.svelte';
	import { href } from '$lib/nav';
	import { m } from '$lib/paraglide/messages.js';
	import { breadcrumbs } from '$lib/seo/jsonld';

	let { data } = $props();

	const rows = $derived(data.rows);

	type Sort = 'curated' | 'name' | 'works';
	let query = $state('');
	let sort = $state<Sort>('curated');

	const sortOptions: { value: Sort; label: string }[] = [
		{ value: 'curated', label: m.sort_curated() },
		{ value: 'name', label: m.sort_name() },
		{ value: 'works', label: m.sort_works() }
	];

	const filtered = $derived(
		rows.filter((row) => row.name.toLowerCase().includes(query.trim().toLowerCase()))
	);

	const visible = $derived(
		sort === 'name'
			? [...filtered].sort((a, b) => a.name.localeCompare(b.name))
			: sort === 'works'
				? [...filtered].sort((a, b) => b.works - a.works || a.name.localeCompare(b.name))
				: filtered
	);
</script>

<Seo
	title={m.seo_universes_title()}
	description={m.seo_universes_description({ count: rows.length })}
	jsonLd={breadcrumbs([
		{ name: 'Continuo', path: '/' },
		{ name: m.universes_heading(), path: '/universen' }
	])}
/>

<header class="pt-6 pb-2">
	<Button.Root
		href={href('/')}
		class="-ml-2 inline-flex h-10 items-center gap-1 rounded-full pr-3 pl-1.5 text-[14px] font-semibold text-muted transition-colors hover:text-ink"
	>
		<Icon name="back" size={20} />Continuo
	</Button.Root>

	<h1 class="mt-5 text-[42px] leading-none font-bold tracking-tight text-balance">
		{m.universes_heading()}
	</h1>
	<p class="mt-3 font-serif text-[17px] text-muted">
		{m.pick_summary({ count: rows.length, works: rows.reduce((sum, r) => sum + r.works, 0) })}
	</p>
</header>

<div class="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
	<div class="flex-1">
		<SearchField bind:value={query} placeholder={m.search_universes_placeholder()} />
	</div>
	<ModeToggle bind:value={sort} options={sortOptions} label={m.sort_label()} />
</div>

<ul class="mt-8 border-t border-hairline pb-20">
	{#each visible as row (row.slug)}
		<li class="border-b border-hairline">
			<UniverseListItem {row} />
		</li>
	{/each}
</ul>

{#if visible.length === 0}
	<p class="-mt-4 pb-20 text-center font-serif text-[18px] text-muted">
		{m.no_universes_results()}
	</p>
{/if}
