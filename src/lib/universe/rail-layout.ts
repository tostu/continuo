import type { Tone, Universe, Work } from './types';

export type RailMode = 'saga' | 'chronology';

export interface RailNode {
	slug: string;
	x: number;
	y: number;
	r: number;
	optional: boolean;
	/** Liegt auf dem Hauptpfad (sonst gestrichelter Seitenast). */
	onPath: boolean;
	tone: Tone;
	labelSide: 'left' | 'right' | 'below';
}

export interface RailBanner {
	id: string;
	label: string;
	tone: Tone;
	x: number;
	y: number;
}

export interface RailEdge {
	id: string;
	from: string;
	to: string;
	dashed: boolean;
	branch: boolean;
	tone: Tone;
}

export interface RailLayout {
	nodes: RailNode[];
	banners: RailBanner[];
	edges: RailEdge[];
	height: number;
}

interface RailGroup {
	id: string;
	label: string;
	tone: Tone;
	/** Knotenfarbe aus der Gruppe statt aus der Saga. */
	colorNodes: boolean;
	works: Work[];
}

const R_REQUIRED = 26;
const R_OPTIONAL = 15;
const TOP = 24;
const BANNER_GAP = 40;
const ROW_REQUIRED = 96;
const ROW_OPTIONAL = 72;
const BRANCH_DROP = 58;
const BRANCH_STACK = 56;
/** Variation der Schlängelung, damit der Pfad nicht mechanisch wirkt. */
const WAVE = [1, 0.78, 0.95, 0.66, 0.88];

const byRelease = (a: Work, b: Work) => a.released.localeCompare(b.released);
const byChronology = (a: Work, b: Work) => a.chronology - b.chronology;

export function groupWorks(u: Pick<Universe, 'works' | 'sagas'>, mode: RailMode): RailGroup[] {
	if (mode === 'chronology') {
		return [
			{
				id: 'chronology',
				label: '',
				tone: 'neutral',
				colorNodes: false,
				works: [...u.works].sort(byChronology)
			}
		];
	}
	const ordered = [...u.works].sort(byRelease);
	return u.sagas
		.map((s) => ({
			id: s.id,
			label: s.name,
			tone: s.tone,
			colorNodes: true,
			works: ordered.filter((w) => w.sagaId === s.id)
		}))
		.filter((g) => g.works.length > 0);
}

export function layoutRail(
	u: Pick<Universe, 'works' | 'sagas'>,
	mode: RailMode,
	width: number
): RailLayout {
	const sagaTone = new Map(u.sagas.map((s) => [s.id, s.tone]));
	const cx = width / 2;
	const amplitude = Math.max(48, Math.min(72, width * 0.2));
	const nodes: RailNode[] = [];
	const banners: RailBanner[] = [];
	const edges: RailEdge[] = [];

	let cursor = TOP;
	let pathIndex = 0;
	let previousOnPath: { node: RailNode; groupId: string } | null = null;

	for (const group of groupWorks(u, mode)) {
		if (mode !== 'chronology') {
			banners.push({
				id: `${mode}-${group.id}`,
				label: group.label,
				tone: group.tone,
				x: cx,
				y: cursor + 16
			});
			cursor += BANNER_GAP;
		}

		let anchor: RailNode | null = null;
		let lastBranch: RailNode | null = null;
		let stack = 0;

		for (const work of group.works) {
			const tone = group.colorNodes ? group.tone : (sagaTone.get(work.sagaId) ?? 'neutral');

			if (work.required || !anchor) {
				const r = work.required ? R_REQUIRED : R_OPTIONAL;
				const row = work.required ? ROW_REQUIRED : ROW_OPTIONAL;
				const sign = pathIndex % 2 === 0 ? -1 : 1;
				const x = cx + sign * amplitude * WAVE[pathIndex % WAVE.length];
				const node: RailNode = {
					slug: work.slug,
					x,
					y: cursor + row / 2 - 8,
					r,
					optional: !work.required,
					onPath: true,
					tone,
					labelSide: x <= cx ? 'right' : 'left'
				};
				nodes.push(node);

				if (previousOnPath) {
					const sameGroup = previousOnPath.groupId === group.id;
					edges.push({
						id: `${previousOnPath.node.slug}->${work.slug}`,
						from: previousOnPath.node.slug,
						to: work.slug,
						dashed: node.optional,
						branch: false,
						tone: sameGroup ? tone : 'neutral'
					});
				}

				previousOnPath = { node, groupId: group.id };
				// Nur Pflicht-Werke dienen als Ankerpunkt für Seitenäste.
				anchor = work.required ? node : anchor;
				lastBranch = null;
				stack = 0;
				cursor += row;
				pathIndex += 1;
				continue;
			}

			// Optionales Werk als Seitenast am letzten Pflicht-Knoten der Gruppe.
			const outward = anchor.x > cx ? 1 : -1;
			const node: RailNode = {
				slug: work.slug,
				x: outward > 0 ? width - 40 : 40,
				y: anchor.y + BRANCH_DROP + stack * BRANCH_STACK,
				r: R_OPTIONAL,
				optional: true,
				onPath: false,
				tone,
				labelSide: 'below'
			};
			nodes.push(node);

			// Mehrere Seitenäste am selben Anker werden verkettet; das Label des oberen
			// Knotens weicht zur Seite, damit die Verbindung es nicht durchkreuzt.
			const parent = lastBranch ?? anchor;
			if (lastBranch) lastBranch.labelSide = outward > 0 ? 'left' : 'right';
			edges.push({
				id: `${parent.slug}->${work.slug}`,
				from: parent.slug,
				to: work.slug,
				dashed: true,
				branch: true,
				tone
			});
			lastBranch = node;
			stack += 1;
			cursor = Math.max(cursor, node.y + 40);
		}
	}

	return { nodes, banners, edges, height: cursor + 24 };
}
