<script lang="ts">
	import { page } from '$app/state';
	import { Button } from 'bits-ui';
	import { href } from '$lib/nav';
	import { m } from '$lib/paraglide/messages.js';
</script>

<section class="flex min-h-dvh flex-col justify-center pb-24">
	<p class="text-[96px] leading-none font-bold tracking-tighter text-arc-3 tabular-nums">
		{page.status}
	</p>
	<h1 class="mt-3 text-[28px] font-bold tracking-tight">{m.not_found()}</h1>
	<p class="mt-2 font-serif text-[18px] text-muted">{page.error?.message}</p>
	<Button.Root
		href={href('/')}
		class="mt-8 inline-flex h-11 w-fit items-center rounded-full bg-arc-1 px-5 text-[14px] font-semibold text-white"
	>
		{m.all_universes()}
	</Button.Root>
</section>
