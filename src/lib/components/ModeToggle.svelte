<script lang="ts" generics="T extends string">
	import { ToggleGroup } from 'bits-ui';

	let {
		value = $bindable(),
		options,
		label
	}: { value: T; options: { value: T; label: string }[]; label: string } = $props();
</script>

<!-- Einzelauswahl darf nicht leer werden: leere Werte werden ignoriert. -->
<ToggleGroup.Root
	type="single"
	bind:value={() => value, (v) => v && (value = v as T)}
	aria-label={label}
	style="grid-template-columns: repeat({options.length}, minmax(0, 1fr))"
	class="grid gap-1 rounded-full bg-surface p-1 ring-1 ring-hairline"
>
	{#each options as option (option.value)}
		<ToggleGroup.Item
			value={option.value}
			class="h-11 rounded-full px-2 text-[14px] font-semibold whitespace-nowrap text-muted transition-colors duration-300 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none data-[state=on]:bg-arc-1 data-[state=on]:text-white motion-reduce:transition-none"
		>
			{option.label}
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>
