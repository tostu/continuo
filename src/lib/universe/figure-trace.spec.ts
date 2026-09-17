import { describe, expect, it } from 'vitest';
import { appearancesOf, figureTrace, rowTitle } from './figure-trace';
import { placementsFor } from './placements';
import type { RailMode } from './rail-layout';
import { loadUniverse } from '$lib/server/universe-repo';

const modes: RailMode[] = ['saga', 'chronology'];

/**
 * Hängt an echten Figuren (Anakin, Maul, Ahsoka in `the-clone-wars`), deshalb aus der lokalen
 * D1: `D1_LOCAL=true bun run test:unit`. Ohne lesbare Datenbank wird übersprungen.
 */
const starWars = await loadUniverse('star-wars').catch((err) => {
	console.warn(`[figure-trace.spec] Keine lesbare D1, Tests übersprungen:\n${err.message}`);
	return undefined;
});

describe.skipIf(!starWars)('figureTrace', () => {
	it.each(modes)('covers every placement and every appearance (%s)', (mode) => {
		for (const figure of starWars!.figures) {
			const trace = figureTrace(starWars!, figure.id, mode);
			expect(trace.slots).toHaveLength(placementsFor(starWars!).length);

			const inRows = new Set(trace.rows.map((r) => r.character));
			expect(appearancesOf(starWars!, figure.id).every((c) => inRows.has(c))).toBe(true);

			// Lücken plus Auftritte füllen genau die Strecke vom ersten bis zum letzten Auftritt.
			const present = trace.slots.flatMap((s, i) => (s.present ? [i] : []));
			const covered = trace.rows.reduce((n, r) => n + r.skipped.length + r.slots.length, 0);
			expect(covered).toBe(present.at(-1)! - present[0] + 1);
		}
	});

	it('follows Anakin into his Darth Vader appearances', () => {
		const trace = figureTrace(starWars!, 'anakin-skywalker', 'chronology');
		const names = new Map(trace.rows.map((r) => [r.work.slug, r.character.name]));
		expect(names.get('episode-iii')).toBe('Anakin Skywalker');
		expect(names.get('episode-iv')).toBe('Darth Vader');
		expect(trace.works).toBe(appearancesOf(starWars!, 'anakin-skywalker').length);
	});

	it('orders rows by the rail order of each mode', () => {
		const order = (mode: RailMode) =>
			figureTrace(starWars!, 'anakin-skywalker', mode).rows.map((r) => r.work.slug);
		const chronology = order('chronology');
		const release = order('saga');
		expect(chronology.indexOf('episode-i')).toBeLessThan(chronology.indexOf('episode-iv'));
		expect(release.indexOf('episode-iv')).toBeLessThan(release.indexOf('episode-i'));
	});

	it('counts plot points per season and merges consecutive seasons', () => {
		// Maul: Clone Wars Staffel 4 und 5, dann erst wieder Staffel 7.
		const rows = figureTrace(starWars!, 'darth-maul', 'chronology').rows.filter(
			(r) => r.work.slug === 'the-clone-wars'
		);
		expect(rows.map((r) => r.slots.map((s) => s.placement.season!.seasonNumber))).toEqual([
			[4, 5],
			[7]
		]);
		expect(rows.map((r) => r.count)).toEqual([2, 1]);
		expect(rows[1].skipped.map((p) => p.season?.seasonNumber)).toEqual([6]);
		expect(rowTitle(rows[0])).toBe('Clone Wars · Staffel 4–5');
	});
});
