<script lang="ts">
	import { ToggleGroup } from 'bits-ui';
	import { toneVar } from '$lib/universe/derive';
	import type { Arc } from '$lib/universe/types';

	let {
		arcs,
		value = $bindable([]),
		label,
		onbeforechange
	}: { arcs: Arc[]; value: string[]; label: string; onbeforechange?: () => void } = $props();
</script>

<ToggleGroup.Root
	type="multiple"
	bind:value={() => value, (v) => (onbeforechange?.(), (value = v))}
	aria-label={label}
	class="flex flex-wrap gap-2"
>
	{#each arcs as arc (arc.id)}
		<ToggleGroup.Item
			value={arc.id}
			style="--tone: {toneVar(arc.tone)}"
			class="group inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold text-ink ring-1 ring-hairline transition-colors hover:ring-(--tone) focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none data-[state=on]:bg-(--tone) data-[state=on]:text-white data-[state=on]:ring-(--tone)"
		>
			<span class="size-2.5 rounded-full bg-(--tone) group-data-[state=on]:bg-white"></span>
			{arc.name}
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>
