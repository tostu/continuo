<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	let { text }: { text?: string } = $props();
</script>

{#if text}
	<p class="mt-1.5 text-[11px] text-muted">{m.image_credit({ source: text })}</p>
{/if}
