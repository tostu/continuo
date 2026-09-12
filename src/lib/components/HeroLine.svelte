<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { toneVar } from '$lib/universe/derive';
	import type { Tone } from '$lib/universe/types';
	import { reducedMotion, useGsap } from '$lib/motion/gsap';

	/**
	 * Dekorative Zeitlinie im Hero: läuft über die volle Fensterbreite, die letzte
	 * Headline-Zeile steht auf ihr, danach fächert sie in drei Handlungsstränge auf.
	 */
	let { host, headline }: { host: HTMLElement; headline: HTMLElement } = $props();

	/** Richtung des Strangs (-1 hoch, 1 runter) und Punkte als Anteil der Reststrecke. */
	const STRANDS: { tone: Tone; dir: number; dots: [t: number, filled: boolean][] }[] = [
		{
			tone: 'arc-1',
			dir: -1,
			dots: [
				[0.1, true],
				[0.36, false],
				[0.64, true]
			]
		},
		{
			tone: 'arc-2',
			dir: 0,
			dots: [
				[0.22, true],
				[0.5, true],
				[0.86, false]
			]
		},
		{
			tone: 'arc-3',
			dir: 1,
			dots: [
				[0.14, false],
				[0.42, true],
				[0.74, true]
			]
		}
	];

	let geo = $state<{ left: number; width: number; height: number; y: number; sx: number }>();
	let svg = $state<SVGSVGElement>();

	function measure() {
		const hostRect = host.getBoundingClientRect();
		const range = document.createRange();
		range.selectNodeContents(headline);
		const rects = [...range.getClientRects()].filter((r) => r.width > 0);
		if (!rects.length) return;
		const bottom = Math.max(...rects.map((r) => r.bottom));
		const right = Math.max(
			...rects.filter((r) => Math.abs(r.bottom - bottom) < 2).map((r) => r.right)
		);
		const fontSize = parseFloat(getComputedStyle(headline).fontSize);
		geo = {
			left: hostRect.left,
			width: document.documentElement.clientWidth,
			height: host.offsetHeight,
			// Ungefähr die Grundlinie der letzten Zeile: der Text steht auf der Linie.
			y: bottom - hostRect.top - fontSize * 0.2,
			sx: right + fontSize * 0.35
		};
	}

	const shape = $derived.by(() => {
		if (!geo) return undefined;
		const { width: w, y, sx } = geo;
		// Schmale Fenster: Fächer genau in den Rest nach der Headline legen, statt ihn abzuschneiden.
		const free = Math.max(0, w - sx);
		const narrow = free < 200;
		const spread = narrow ? 16 : Math.min(96, Math.max(36, w * 0.06));
		const bend = narrow ? free : Math.min(300, free * 0.4);
		const ex = sx + bend;
		const room = w - ex;
		return {
			trunk: `M0 ${y}H${sx}`,
			trunkDots: geo.left > 80 ? [geo.left * 0.3, geo.left * 0.68] : [],
			strands: STRANDS.map((s) => {
				const ty = y + s.dir * spread;
				return {
					tone: s.tone,
					path: `M${sx} ${y}C${sx + bend * 0.55} ${y} ${sx + bend * 0.45} ${ty} ${ex} ${ty}H${w}`,
					dots: (room > 160 ? s.dots : []).map(([t, filled]) => ({
						x: ex + t * room,
						y: ty,
						filled
					}))
				};
			})
		};
	});

	onMount(() => {
		let ready = false;
		let tl: ReturnType<ReturnType<typeof useGsap>['gsap']['timeline']> | undefined;
		const ro = new ResizeObserver(() => ready && measure());
		ro.observe(host);

		// Erst messen, wenn die Schrift steht – sonst sitzt die Linie an der falschen Grundlinie.
		document.fonts.ready.then(async () => {
			measure();
			ready = true;
			await tick();
			if (!svg || reducedMotion()) return;
			const { gsap } = useGsap();
			tl = gsap.timeline({ delay: 0.1 });
			tl.from(svg.querySelector('[data-trunk]'), {
				drawSVG: '0%',
				duration: 0.9,
				ease: 'power2.in'
			});
			tl.from(svg.querySelectorAll('[data-strand]'), {
				drawSVG: '0%',
				duration: 1.4,
				ease: 'power2.out',
				stagger: 0.08
			});
			tl.from(
				svg.querySelectorAll('[data-dot]'),
				{
					scale: 0,
					transformOrigin: '50% 50%',
					duration: 0.4,
					ease: 'back.out(2.6)',
					stagger: 0.04
				},
				'-=1.1'
			);
		});

		return () => {
			ro.disconnect();
			tl?.kill();
		};
	});
</script>

{#if geo && shape}
	<svg
		bind:this={svg}
		width={geo.width}
		height={geo.height}
		class="pointer-events-none absolute top-0"
		style:left="{-geo.left}px"
		aria-hidden="true"
	>
		<path data-trunk d={shape.trunk} class="stroke-neutral" stroke-width="3" fill="none" />
		{#each shape.trunkDots as x (x)}
			<circle data-dot cx={x} cy={geo.y} r="6.5" class="fill-neutral" />
		{/each}
		{#each shape.strands as strand (strand.tone)}
			<path
				data-strand
				d={strand.path}
				style:stroke={toneVar(strand.tone)}
				stroke-width="3"
				stroke-linecap="round"
				fill="none"
			/>
			{#each strand.dots as dot (dot.x)}
				<circle
					data-dot
					cx={dot.x}
					cy={dot.y}
					r={dot.filled ? 9 : 6.5}
					style:fill={dot.filled ? toneVar(strand.tone) : 'var(--color-ground)'}
					style:stroke={dot.filled ? 'var(--color-ground)' : toneVar(strand.tone)}
					stroke-width={dot.filled ? 4 : 3}
				/>
			{/each}
		{/each}
	</svg>
{/if}
