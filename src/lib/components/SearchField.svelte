<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		value = $bindable(''),
		placeholder,
		onbeforechange
	}: { value: string; placeholder: string; onbeforechange?: () => void } = $props();
</script>

<label class="relative block">
	<span class="sr-only">{placeholder}</span>
	<Icon
		name="search"
		size={18}
		class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
	/>
	<input
		type="search"
		{placeholder}
		bind:value={() => value, (v) => (onbeforechange?.(), (value = v))}
		class="h-12 w-full rounded-full border-0 bg-surface pr-4 pl-11 text-[15px] text-ink ring-1 ring-hairline placeholder:text-muted focus:ring-2 focus:ring-arc-1"
	/>
</label>
