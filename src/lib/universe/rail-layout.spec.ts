import { describe, expect, it } from 'vitest';
import { groupWorks, layoutRail, type RailMode } from './rail-layout';
import { loadUniverse } from '$lib/server/universe-repo';

const modes: RailMode[] = ['saga', 'chronology'];

/**
 * Die Assertions hängen an echten Werken (`episode-iii`, `the-clone-wars`), deshalb
 * kommt das Universum aus der lokalen D1: `D1_LOCAL=true bun run test:unit`.
 * Ohne lesbare Datenbank wird übersprungen statt zu scheitern.
 */
const starWars = await loadUniverse('star-wars').catch((err) => {
	console.warn(`[rail-layout.spec] Keine lesbare D1, Tests übersprungen:\n${err.message}`);
	return undefined;
});

describe.skipIf(!starWars)('layoutRail', () => {
	it.each(modes)('places every work exactly once (%s)', (mode) => {
		const { nodes } = layoutRail(starWars!, mode, 360);
		expect(new Set(nodes.map((n) => n.slug)).size).toBe(starWars!.works.length);
		expect(nodes).toHaveLength(starWars!.works.length);
	});

	it('branches optional works off the main path in saga mode', () => {
		const { nodes, edges } = layoutRail(starWars!, 'saga', 360);
		const cloneWars = nodes.find((n) => n.slug === 'the-clone-wars')!;
		expect(cloneWars.onPath).toBe(false);
		expect(edges).toContainEqual(
			expect.objectContaining({
				from: 'episode-iii',
				to: 'the-clone-wars',
				branch: true,
				dashed: true
			})
		);

		const branched = new Set(nodes.filter((n) => !n.onPath).map((n) => n.slug));
		const pathEdges = edges.filter((e) => !e.branch);
		expect(pathEdges.some((e) => branched.has(e.from) || branched.has(e.to))).toBe(false);
	});

	it('orders by in-universe chronology instead of release date in chronology mode', () => {
		const { nodes } = layoutRail(starWars!, 'chronology', 360);
		const episodeI = nodes.find((n) => n.slug === 'episode-i')!;
		const episodeIV = nodes.find((n) => n.slug === 'episode-iv')!;
		// Episode I released 1999, after Episode IV (1977), but comes first in-universe.
		expect(episodeI.y).toBeLessThan(episodeIV.y);
	});

	it.each(modes)('puts each banner above the first work of its group (%s)', (mode) => {
		const { nodes, banners } = layoutRail(starWars!, mode, 360);
		const groups = groupWorks(starWars!, mode);
		expect(banners).toHaveLength(groups.length);
		groups.forEach((group, i) => {
			const first = nodes.find((n) => n.slug === group.works[0].slug)!;
			expect(banners[i].y).toBeLessThan(first.y - first.r);
		});
	});

	it('keeps nodes inside the given width', () => {
		for (const mode of modes) {
			for (const node of layoutRail(starWars!, mode, 335).nodes) {
				expect(node.x - node.r).toBeGreaterThanOrEqual(0);
				expect(node.x + node.r).toBeLessThanOrEqual(335);
			}
		}
	});
});
