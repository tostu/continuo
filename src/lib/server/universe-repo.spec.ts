import { describe, expect, it } from 'vitest';
import { listUniverses } from './universe-repo';

/**
 * Prüft die Daten in D1 gegen das, was die Fremdschlüssel nicht abdecken können.
 * Referenzen (sagaId, workSlug, figureId, characterId, arcId) erzwingt das Schema selbst –
 * hier bleiben Eindeutigkeit über Universen hinweg und der Wertebereich von `at`.
 *
 * Läuft gegen die lokale D1: `D1_LOCAL=true bun run test:unit`. Ohne lokale Datenbank
 * (frischer Checkout) werden die Tests übersprungen statt zu scheitern.
 */
const registry = await listUniverses().catch((err) => {
	console.warn(`[data.spec] Keine lesbare D1, Tests übersprungen:\n${err.message}`);
	return undefined;
});

const duplicates = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);

describe.skipIf(!registry)('Universums-Daten', () => {
	it('hat eindeutige Universums-Slugs', () => {
		expect(duplicates(registry!.map((e) => e.slug))).toEqual([]);
	});

	describe.each(registry?.map((e) => [e.universe.name, e.universe] as const) ?? [])(
		'%s',
		(_, u) => {
			it('hält jeden Plot Point im Wertebereich seines Werks', () => {
				const works = new Map(u.works.map((w) => [w.slug, w]));
				const outside = u.plotPoints
					.filter((p) => {
						const work = works.get(p.workSlug)!;
						return p.at < work.range[0] || p.at > work.range[1];
					})
					.map((p) => `${p.id}: at ${p.at} außerhalb ${works.get(p.workSlug)!.range.join('–')}`);

				expect(outside).toEqual([]);
			});

			it('hat keine Figur ohne Auftritt', () => {
				const appearing = new Set(u.characters.map((c) => c.figureId));
				expect(u.figures.filter((f) => !appearing.has(f.id)).map((f) => f.id)).toEqual([]);
			});
		}
	);
});
