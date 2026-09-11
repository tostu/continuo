<script lang="ts">
	type Name = 'film' | 'tv' | 'play' | 'back' | 'search' | 'arrow-down';

	let {
		name,
		size = 18,
		class: className = ''
	}: { name: Name; size?: number; class?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	aria-hidden="true"
>
	{#if name === 'film'}
		<rect x="3.5" y="3.5" width="17" height="17" rx="3" />
		<path d="M8 3.5v17M16 3.5v17M3.5 9H8M3.5 15H8M16 9h4.5M16 15h4.5" />
	{:else if name === 'tv'}
		<rect x="3" y="7" width="18" height="13" rx="2.5" />
		<path d="m8 3 4 4 4-4" />
	{:else if name === 'play'}
		<path d="M7.5 4.8v14.4L19 12z" fill="currentColor" />
	{:else if name === 'back'}
		<path d="M15 5l-7 7 7 7" />
	{:else if name === 'search'}
		<circle cx="11" cy="11" r="6.5" />
		<path d="m20 20-4.2-4.2" />
	{:else if name === 'arrow-down'}
		<path d="M12 5v14M6 13l6 6 6-6" />
	{/if}
</svg>
