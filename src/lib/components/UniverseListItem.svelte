<script lang="ts">
	import Icon from './Icon.svelte';
	import { toneVar } from '$lib/universe/derive';
	import { href } from '$lib/nav';
	import { m } from '$lib/paraglide/messages.js';
	import type { UniverseSummary } from '$lib/universe/summarize';

	let { row }: { row: UniverseSummary } = $props();
</script>

<a
	href={href(`/${row.slug}`)}
	class="group -mx-3 block rounded-2xl px-3 py-8 transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-ink sm:-mx-5 sm:px-5 sm:py-10"
>
	<div class="flex items-baseline justify-between gap-4">
		<h3 class="text-[32px] leading-none font-bold tracking-[-0.03em] sm:text-[44px]">
			{row.name}
		</h3>
		<span class="shrink-0 text-[15px] text-muted tabular-nums">{row.from}–{row.to}</span>
	</div>

	<!-- Mini-Chronologie: jedes Werk ein Punkt, x = Erscheinungsdatum. -->
	<div class="relative mx-1.5 mt-8 h-5" aria-hidden="true">
		<span class="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-neutral"></span>
		{#each row.dots as dot (dot.slug)}
			<span
				class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full {dot.required
					? 'size-4 ring-2 ring-ground group-hover:ring-card'
					: 'size-3.5 border-2 bg-ground group-hover:bg-card'}"
				style:left="{dot.x * 100}%"
				style:background-color={dot.required ? toneVar(dot.tone) : undefined}
				style:border-color={dot.required ? undefined : toneVar(dot.tone)}
			></span>
		{/each}
	</div>

	<ul class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
		{#each row.sagas as saga (saga.id)}
			<li class="inline-flex items-center gap-1.5 text-[13px] text-muted">
				<span class="size-2 rounded-full" style:background-color={toneVar(saga.tone)}></span>
				{saga.name}
			</li>
		{/each}
	</ul>

	<div class="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
		<dl class="flex flex-wrap gap-x-6 gap-y-1 text-[14px] text-muted">
			<div>
				<dt class="sr-only">{m.stat_works()}</dt>
				<dd>
					<span class="font-semibold text-ink tabular-nums">{row.works}</span>
					{m.works_summary({ required: row.required })}
				</dd>
			</div>
			<div>
				<dt class="sr-only">{m.stat_characters()}</dt>
				<dd>
					<span class="font-semibold text-ink tabular-nums">{row.characters}</span>
					{m.stat_characters()}
				</dd>
			</div>
			<div>
				<dt class="sr-only">{m.stat_plot_points()}</dt>
				<dd>
					<span class="font-semibold text-ink tabular-nums">{row.plotPoints}</span>
					{m.stat_plot_points()}
				</dd>
			</div>
			{#if row.nowPlaying}
				<div class="inline-flex items-center gap-1.5" style:color={toneVar(row.nowPlayingTone)}>
					<dt class="inline-flex items-center gap-1.5">
						<Icon name="play" size={10} />{m.now_playing()}:
					</dt>
					<dd class="font-semibold">{row.nowPlaying.short}</dd>
				</div>
			{/if}
		</dl>
		<span class="inline-flex items-center gap-3 text-[15px] font-semibold">
			{m.open_timeline()}
			<span
				class="grid size-9 place-items-center rounded-full bg-raised transition-colors group-hover:bg-ink group-hover:text-ground"
			>
				<Icon name="back" size={18} class="rotate-180" />
			</span>
		</span>
	</div>
</a>
