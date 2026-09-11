import { describe, expect, it } from 'vitest';
import { groupWorks, layoutRail, type RailMode } from './rail-layout';
import { starWars } from './star-wars';

const modes: RailMode[] = ['saga', 'strang', 'pflicht'];

describe('layoutRail', () => {
	it.each(modes)('places every work exactly once (%s)', (mode) => {
		const { nodes } = layoutRail(starWars, mode, 360);
		expect(new Set(nodes.map((n) => n.slug)).size).toBe(starWars.works.length);
		expect(nodes).toHaveLength(starWars.works.length);
	});

	it('branches optional works off the main path in saga mode', () => {
		const { nodes, edges } = layoutRail(starWars, 'saga', 360);
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

	it('keeps all essential works above optional ones in pflicht mode', () => {
		const { nodes } = layoutRail(starWars, 'pflicht', 360);
		const lowestRequired = Math.max(...nodes.filter((n) => !n.optional).map((n) => n.y));
		const highestOptional = Math.min(...nodes.filter((n) => n.optional).map((n) => n.y));
		expect(lowestRequired).toBeLessThan(highestOptional);
	});

	it.each(modes)('puts each banner above the first work of its group (%s)', (mode) => {
		const { nodes, banners } = layoutRail(starWars, mode, 360);
		const groups = groupWorks(starWars, mode);
		expect(banners).toHaveLength(groups.length);
		groups.forEach((group, i) => {
			const first = nodes.find((n) => n.slug === group.works[0].slug)!;
			expect(banners[i].y).toBeLessThan(first.y - first.r);
		});
	});

	it('keeps nodes inside the given width', () => {
		for (const mode of modes) {
			for (const node of layoutRail(starWars, mode, 335).nodes) {
				expect(node.x - node.r).toBeGreaterThanOrEqual(0);
				expect(node.x + node.r).toBeLessThanOrEqual(335);
			}
		}
	});
});
