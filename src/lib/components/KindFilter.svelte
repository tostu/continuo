<script lang="ts">
	import { ToggleGroup } from 'bits-ui';
	import Icon from './Icon.svelte';
	import type { Work } from '$lib/universe/types';
	import { m } from '$lib/paraglide/messages.js';

	let { value = $bindable(), label }: { value: Work['kind'][]; label: string } = $props();

	const kinds: { value: Work['kind']; icon: 'film' | 'tv'; label: string }[] = [
		{ value: 'film', icon: 'film', label: m.kind_film() },
		{ value: 'serie', icon: 'tv', label: m.kind_series() }
	];
</script>

<!-- Mehrfachauswahl: Film und Serie lassen sich unabhängig voneinander an- und abschalten. -->
<ToggleGroup.Root
	type="multiple"
	bind:value
	aria-label={label}
	class="flex gap-1 rounded-full bg-surface p-1 ring-1 ring-hairline"
>
	{#each kinds as kind (kind.value)}
		<ToggleGroup.Item
			value={kind.value}
			title={kind.label}
			aria-label={kind.label}
			class="grid size-11 place-items-center rounded-full text-muted transition-colors duration-300 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none data-[state=on]:bg-arc-1 data-[state=on]:text-white motion-reduce:transition-none"
		>
			<Icon name={kind.icon} size={20} />
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>
