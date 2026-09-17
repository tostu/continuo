/**
 * Die Spur einer Figur durchs Universum: auf welchen Platzierungen des Zeitstrahls sie
 * auftaucht, wie stark (Plot Points) und wie viel dazwischen ohne sie passiert.
 *
 * Grundlage ist dieselbe Reihenfolge wie im Zeitstrahl (`groupWorks`), damit Spur und
 * Universums-Seite nie auseinanderlaufen.
 */
import { plotPointsFor } from './derive';
import { groupWorks, type RailMode } from './rail-layout';
import type { Placement } from './placements';
import type { Character, Figure, Tone, Universe, Work } from './types';

export interface TraceSlot {
	placement: Placement;
	/** Auftritt der Figur im Werk dieser Platzierung, auch wenn sie in dieser Staffel fehlt. */
	character?: Character;
	/** Plot Points der Figur in dieser Platzierung – bei Staffeln nur die aus deren Bereich. */
	count: number;
	/** Die Figur ist in dieser Platzierung zu sehen. */
	present: boolean;
	tone: Tone;
}

/** Zusammenhängender Auftritt: aufeinanderfolgende Platzierungen desselben Werks. */
export interface TraceRow {
	character: Character;
	work: Work;
	slots: TraceSlot[];
	count: number;
	/** Platzierungen ohne die Figur seit der vorigen Zeile; leer bei der ersten. */
	skipped: Placement[];
	tone: Tone;
}

/** Saga-Abschnitt auf der Platzierungsachse, `from`/`to` sind Slot-Indizes (inklusive). */
export interface TraceBand {
	id: string;
	label: string;
	tone: Tone;
	from: number;
	to: number;
}

export interface FigureTrace {
	figure: Figure;
	slots: TraceSlot[];
	rows: TraceRow[];
	bands: TraceBand[];
	/** Werke, in denen die Figur vorkommt. */
	works: number;
	totalWorks: number;
	points: number;
}

export const appearancesOf = (u: Pick<Universe, 'characters'>, figureId: string): Character[] =>
	u.characters.filter((c) => c.figureId === figureId);

/** Zerlegt Platzierungen in Läufe aufeinanderfolgender Platzierungen desselben Werks. */
export function workRuns(placements: Placement[]): Placement[][] {
	const runs: Placement[][] = [];
	for (const p of placements) {
		const last = runs.at(-1);
		if (last && last[0].work.slug === p.work.slug) last.push(p);
		else runs.push([p]);
	}
	return runs;
}

/** Werk plus Staffel bzw. Staffelspanne („Clone Wars · Staffel 1–3“), je Lauf. */
export function spanTitle(placements: Placement[]): string {
	return workRuns(placements)
		.map((run) => {
			const { work } = run[0];
			const first = run[0].season;
			const last = run.at(-1)!.season;
			if (!first || !last) return work.short;
			if (first === last) return `${work.short} · ${first.label}`;
			const a = first.label.match(/^(.*?)(\d+)$/);
			const b = last.label.match(/^(.*?)(\d+)$/);
			const range =
				a && b && a[1] === b[1] ? `${first.label}–${b[2]}` : `${first.label} – ${last.label}`;
			return `${work.short} · ${range}`;
		})
		.join(', ');
}

export const rowTitle = (row: TraceRow): string => spanTitle(row.slots.map((s) => s.placement));

export function figureTrace(u: Universe, figureId: string, mode: RailMode): FigureTrace {
	const figure = u.figures.find((f) => f.id === figureId) ?? {
		id: figureId,
		name: figureId,
		initials: ''
	};
	const byWork = new Map(appearancesOf(u, figureId).map((c) => [c.workSlug, c]));

	const slots: TraceSlot[] = [];
	const bands: TraceBand[] = [];
	for (const group of groupWorks(u, mode)) {
		bands.push({
			id: group.id,
			label: group.label,
			tone: group.tone,
			from: slots.length,
			to: slots.length + group.placements.length - 1
		});
		for (const placement of group.placements) {
			const character = byWork.get(placement.work.slug);
			const points = character ? plotPointsFor(u, character.workSlug, character.id) : [];
			const season = placement.season;
			const count = season
				? points.filter((p) => p.at >= season.range[0] && p.at <= season.range[1]).length
				: points.length;
			slots.push({ placement, character, count, present: count > 0, tone: group.tone });
		}
	}

	// Eine Figur ohne Plot Points (oder nur außerhalb aller Staffelbereiche) gehört trotzdem
	// zum Werk: dann zählt die erste Platzierung des Werks als Auftritt.
	for (const character of byWork.values()) {
		const own = slots.filter((s) => s.character === character);
		if (own.length && !own.some((s) => s.present)) {
			const first = own.reduce((a, b) =>
				(a.placement.season?.seasonNumber ?? 0) <= (b.placement.season?.seasonNumber ?? 0) ? a : b
			);
			first.present = true;
		}
	}

	const rows: TraceRow[] = [];
	let skipped: Placement[] = [];
	let previous: TraceSlot | undefined;
	for (const slot of slots) {
		if (!slot.present) {
			if (rows.length) skipped.push(slot.placement);
			previous = slot;
			continue;
		}
		const last = rows.at(-1);
		if (last && previous?.present && previous.character === slot.character) {
			last.slots.push(slot);
			last.count += slot.count;
		} else {
			rows.push({
				character: slot.character!,
				work: slot.placement.work,
				slots: [slot],
				count: slot.count,
				skipped,
				tone: slot.tone
			});
			skipped = [];
		}
		previous = slot;
	}

	return {
		figure,
		slots,
		rows,
		bands,
		works: byWork.size,
		totalWorks: u.works.length,
		points: [...byWork.values()].reduce(
			(sum, c) => sum + plotPointsFor(u, c.workSlug, c.id).length,
			0
		)
	};
}
