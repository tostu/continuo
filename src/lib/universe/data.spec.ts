import { describe, expect, it } from 'vitest';
import { universes as registry } from './registry';

/** Querverweise, die das JSON-Schema nicht prüfen kann – fängt Tippfehler in handgepflegten Daten. */
const universes = registry.map((e) => e.universe);

const duplicates = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);

it('hat eindeutige Universums-Slugs', () => {
	expect(duplicates(registry.map((e) => e.slug))).toEqual([]);
});

describe.each(universes.map((u) => [u.name, u] as const))('%s', (_, u) => {
	it('hat eindeutige IDs', () => {
		expect(duplicates(u.sagas.map((s) => s.id))).toEqual([]);
		expect(duplicates(u.works.map((w) => w.slug))).toEqual([]);
		expect(duplicates(u.arcs.map((a) => a.id))).toEqual([]);
		// Figuren-URLs sind /[universum]/werk/[werk]/figur/[figur] – eindeutig je Werk reicht.
		expect(duplicates(u.characters.map((c) => `${c.workSlug}/${c.id}`))).toEqual([]);
		expect(duplicates(u.plotPoints.map((p) => p.id))).toEqual([]);
	});

	it('verweist nur auf existierende Einträge', () => {
		const sagas = new Set(u.sagas.map((s) => s.id));
		const works = new Map(u.works.map((w) => [w.slug, w]));
		const arcs = new Map(u.arcs.map((a) => [a.id, a]));
		const characters = new Set(u.characters.map((c) => `${c.workSlug}/${c.id}`));
		const broken: string[] = [];

		for (const w of u.works) {
			if (!sagas.has(w.sagaId)) broken.push(`Werk ${w.slug}: sagaId ${w.sagaId}`);
		}
		for (const a of u.arcs) {
			if (!works.has(a.workSlug)) broken.push(`Arc ${a.id}: workSlug ${a.workSlug}`);
		}
		for (const c of u.characters) {
			if (!works.has(c.workSlug)) broken.push(`Figur ${c.id}: workSlug ${c.workSlug}`);
		}
		for (const p of u.plotPoints) {
			const work = works.get(p.workSlug);
			if (!work) broken.push(`Plot Point ${p.id}: workSlug ${p.workSlug}`);
			if (!characters.has(`${p.workSlug}/${p.characterId}`))
				broken.push(`Plot Point ${p.id}: characterId ${p.characterId}`);
			if (arcs.get(p.arcId)?.workSlug !== p.workSlug)
				broken.push(`Plot Point ${p.id}: arcId ${p.arcId}`);
			if (work && (p.at < work.range[0] || p.at > work.range[1]))
				broken.push(`Plot Point ${p.id}: at ${p.at} außerhalb ${work.range.join('–')}`);
		}

		expect(broken).toEqual([]);
	});
});
