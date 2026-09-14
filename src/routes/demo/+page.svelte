<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
</script>

<Seo title="Demo · Continuo" description="Interne Demo-Seite." noindex />

<a href={resolve('/demo/playwright')}>playwright</a>
