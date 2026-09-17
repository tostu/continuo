import {
	placementChronology,
	placementRequired,
	placementSagaId,
	placementsFor,
	placementReleased,
	type Placement
} from './placements';
import type { Tone, Universe } from './types';

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
	placements: Placement[];
}

const R_REQUIRED = 38;
const R_OPTIONAL = 23;
const TOP = 24;
const BANNER_GAP = 54;
const ROW_REQUIRED = 132;
const ROW_OPTIONAL = 104;
const BRANCH_DROP = 78;
const BRANCH_STACK = 76;
/** Variation der Schlängelung, damit der Pfad nicht mechanisch wirkt. */
const WAVE = [1, 0.78, 0.95, 0.66, 0.88];

const byRelease = (a: Placement, b: Placement) =>
	placementReleased(a).localeCompare(placementReleased(b));
const byChronology = (a: Placement, b: Placement) =>
	placementChronology(a) - placementChronology(b);

/**
 * Sortiert Platzierungen nach `compare` und schneidet ein neues Banner, sobald sich
 * die Saga ändert – bei Saga-Modus (Release-Reihenfolge) kann eine Saga so
 * über mehrere getrennte Banner auftauchen, wenn ihre Werke über die Zeit
 * verstreut veröffentlicht wurden.
 */
function bannerGroups(
	placements: Placement[],
	sagas: Universe['sagas'],
	compare: (a: Placement, b: Placement) => number
) {
	const sagaById = new Map(sagas.map((s) => [s.id, s]));
	const groups: RailGroup[] = [];
	let lastSagaId: string | null = null;
	for (const placement of [...placements].sort(compare)) {
		const sagaId = placementSagaId(placement);
		const saga = sagaById.get(sagaId);
		const last = groups.at(-1);
		if (last && lastSagaId === sagaId) {
			last.placements.push(placement);
		} else {
			groups.push({
				id: `${sagaId}-${groups.length}`,
				label: saga?.name ?? '',
				tone: saga?.tone ?? 'neutral',
				colorNodes: true,
				placements: [placement]
			});
		}
		lastSagaId = sagaId;
	}
	return groups;
}

export function groupWorks(
	u: Pick<Universe, 'works' | 'seasons' | 'sagas'>,
	mode: RailMode
): RailGroup[] {
	return bannerGroups(placementsFor(u), u.sagas, mode === 'chronology' ? byChronology : byRelease);
}

export function layoutRail(
	u: Pick<Universe, 'works' | 'seasons' | 'sagas'>,
	mode: RailMode,
	width: number
): RailLayout {
	const sagaTone = new Map(u.sagas.map((s) => [s.id, s.tone]));
	const cx = width / 2;
	const amplitude = Math.max(68, Math.min(100, width * 0.24));
	const branchReach = Math.max(76, Math.min(130, width * 0.28));
	const nodes: RailNode[] = [];
	const banners: RailBanner[] = [];
	const edges: RailEdge[] = [];

	let cursor = TOP;
	let pathIndex = 0;
	let previousOnPath: { node: RailNode; groupId: string } | null = null;
	// Bleibt über eine Gruppengrenze hinweg bestehen, damit ein Seitenast, der am Ende
	// einer Gruppe offen war, noch an das erste Werk der nächsten Gruppe anschließen kann.
	let lastBranch: RailNode | null = null;

	for (const group of groupWorks(u, mode)) {
		// Release-Modus ist keine Saga-Gruppierung mehr, daher kein Saga-Banner.
		if (mode !== 'saga') {
			banners.push({
				id: `${mode}-${group.id}`,
				label: group.label,
				tone: group.tone,
				x: cx,
				y: cursor + 16
			});
			cursor += BANNER_GAP;
		}

		// Jede Gruppe (Saga-Banner) startet mit einem frischen Anker, damit ihr erstes
		// Werk immer auf dem Hauptpfad landet statt als Seitenast am alten Anker zu hängen.
		let anchor: RailNode | null = null;
		let stack = 0;

		for (const placement of group.placements) {
			const required = placementRequired(placement);
			const sagaId = placementSagaId(placement);
			const tone = group.colorNodes ? group.tone : (sagaTone.get(sagaId) ?? 'neutral');

			if (required || !anchor) {
				const r = required ? R_REQUIRED : R_OPTIONAL;
				const row = required ? ROW_REQUIRED : ROW_OPTIONAL;
				const sign = pathIndex % 2 === 0 ? -1 : 1;
				const x = cx + sign * amplitude * WAVE[pathIndex % WAVE.length];
				const node: RailNode = {
					slug: placement.slug,
					x,
					y: cursor + row / 2 - 8,
					r,
					optional: !required,
					onPath: true,
					tone,
					labelSide: x <= cx ? 'right' : 'left'
				};
				nodes.push(node);

				if (previousOnPath) {
					const sameGroup = previousOnPath.groupId === group.id;
					edges.push({
						id: `${previousOnPath.node.slug}->${placement.slug}`,
						from: previousOnPath.node.slug,
						to: placement.slug,
						dashed: node.optional,
						branch: false,
						tone: sameGroup ? tone : 'neutral'
					});
				}

				// Schließt Seitenäste wieder an den Hauptpfad an, wenn ihre Geschichte
				// zeitlich vor diesem Pflicht-Werk liegt.
				if (lastBranch) {
					edges.push({
						id: `${lastBranch.slug}->${placement.slug}`,
						from: lastBranch.slug,
						to: placement.slug,
						dashed: true,
						branch: true,
						tone
					});
				}

				previousOnPath = { node, groupId: group.id };
				// Nur Pflicht-Werke dienen als Ankerpunkt für Seitenäste.
				anchor = required ? node : anchor;
				lastBranch = null;
				stack = 0;
				cursor += row;
				pathIndex += 1;
				continue;
			}

			// Optionales Werk als Seitenast am letzten Pflicht-Knoten der Gruppe.
			// Bleibt nah am Anker statt an den Bildschirmrand zu springen; die Distanz
			// variiert pro Kettenglied (WAVE), damit die Verbindung zwischen gestapelten
			// Seitenästen nicht schnurgerade wirkt.
			const outward = anchor.x > cx ? 1 : -1;
			const reach = branchReach * WAVE[stack % WAVE.length];
			const x = Math.min(width - 40, Math.max(40, anchor.x + outward * reach));
			const node: RailNode = {
				slug: placement.slug,
				x,
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
				id: `${parent.slug}->${placement.slug}`,
				from: parent.slug,
				to: placement.slug,
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
