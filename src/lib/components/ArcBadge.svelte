<script lang="ts">
	import { toneVar } from '$lib/universe/derive';
	import type { Tone } from '$lib/universe/types';

	let { name, tone }: { name: string; tone: Tone } = $props();
</script>

<span
	class="inline-flex items-center rounded-full px-3.5 py-1 text-[13px] font-semibold tracking-tight text-white"
	style:background-color={toneVar(tone)}
>
	{name}
</span>
