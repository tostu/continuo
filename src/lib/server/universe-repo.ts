/**
 * Liest die Universums-Daten aus D1 und setzt sie zu genau dem `Universe`-Objekt
 * zusammen, das die Seite vorher aus JSON importiert hat. Damit bleiben
 * `$lib/universe/derive` und sämtliche Komponenten unverändert.
 *
 * Läuft ausschließlich zur Build-Zeit: die Seite ist vorgerendert (`prerender = true`),
 * der deployte Worker fragt D1 nie an.
 */
import { building } from '$app/environment';
import { asc, eq } from 'drizzle-orm';
import { getDb } from './db';
import * as t from './db/schema';
import type {
	Arc,
	Character,
	Figure,
	PlotPoint,
	Saga,
	Season,
	Tone,
	Universe,
	Work
} from '$lib/universe/types';

export interface UniverseEntry {
	/** URL-Segment: /[universum]/werk/… */
	slug: string;
	universe: Universe;
}

/**
 * Beim Prerendern ruft jede Seite das Universum erneut ab (Layout, Seite, `entries`) –
 * über die D1-REST-API sind das schnell über 10.000 Requests und damit weit über dem
 * globalen API-Limit von Cloudflare. Im Build ändern sich die Daten nicht, also wird
 * pro Prozess nur einmal gelesen. Im Dev-Server bleibt es ungecacht, damit geänderte
 * Daten sofort sichtbar sind.
 */
const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, read: () => Promise<T>): Promise<T> {
	if (!building) return read();
	let hit = cache.get(key) as Promise<T> | undefined;
	if (!hit) {
		hit = read();
		// Fehlgeschlagene Abfragen nicht festhalten, sonst scheitert jeder weitere Versuch.
		hit.catch(() => cache.delete(key));
		cache.set(key, hit);
	}
	return hit;
}

export function listUniverseSlugs(): Promise<string[]> {
	return cached('slugs', readUniverseSlugs);
}

export function loadUniverse(slug: string): Promise<Universe | undefined> {
	return cached(`universe:${slug}`, () => readUniverse(slug));
}

async function readUniverseSlugs(): Promise<string[]> {
	const db = await getDb();
	const rows = await db
		.select({ slug: t.universes.slug })
		.from(t.universes)
		.orderBy(asc(t.universes.sortOrder))
		.all();
	return rows.map((r) => r.slug);
}

async function readUniverse(slug: string): Promise<Universe | undefined> {
	const db = await getDb();

	const universe = await db.select().from(t.universes).where(eq(t.universes.slug, slug)).get();
	if (!universe) return undefined;

	const [sagaRows, workRows, seasonRows, arcRows, figureRows, characterRows, plotPointRows] =
		await Promise.all([
			db
				.select()
				.from(t.sagas)
				.where(eq(t.sagas.universeSlug, slug))
				.orderBy(asc(t.sagas.sortOrder))
				.all(),
			db
				.select()
				.from(t.works)
				.where(eq(t.works.universeSlug, slug))
				.orderBy(asc(t.works.sortOrder))
				.all(),
			db
				.select()
				.from(t.seasons)
				.where(eq(t.seasons.universeSlug, slug))
				.orderBy(asc(t.seasons.sortOrder))
				.all(),
			db
				.select()
				.from(t.arcs)
				.where(eq(t.arcs.universeSlug, slug))
				.orderBy(asc(t.arcs.sortOrder))
				.all(),
			db
				.select()
				.from(t.figures)
				.where(eq(t.figures.universeSlug, slug))
				.orderBy(asc(t.figures.sortOrder))
				.all(),
			db
				.select()
				.from(t.characters)
				.where(eq(t.characters.universeSlug, slug))
				.orderBy(asc(t.characters.sortOrder))
				.all(),
			db
				.select()
				.from(t.plotPoints)
				.where(eq(t.plotPoints.universeSlug, slug))
				.orderBy(asc(t.plotPoints.at))
				.all()
		]);

	const sagas: Saga[] = sagaRows.map((s) => ({ id: s.id, name: s.name, tone: s.tone as Tone }));

	const works: Work[] = workRows.map((w) => ({
		slug: w.slug,
		title: w.title,
		short: w.short,
		kind: w.kind as Work['kind'],
		released: w.released,
		chronology: w.chronology,
		loreDate: w.loreDate,
		sagaId: w.sagaId,
		required: w.required,
		unit: w.unit as Work['unit'],
		range: [w.rangeStart, w.rangeEnd],
		// Das JSON-Feld war optional – `undefined` statt `null`, damit `{#if}` sich
		// verhält wie vorher.
		...(w.nowPlaying ? { nowPlaying: true } : {})
	}));

	const seasons: Season[] = seasonRows.map((s) => ({
		id: s.id,
		workSlug: s.workSlug,
		seasonNumber: s.seasonNumber,
		label: s.label,
		released: s.released,
		chronology: s.chronology,
		loreDate: s.loreDate,
		range: [s.rangeStart, s.rangeEnd],
		...(s.sagaId ? { sagaId: s.sagaId } : {})
	}));

	const arcs: Arc[] = arcRows.map((a) => ({
		id: a.id,
		workSlug: a.workSlug,
		name: a.name,
		tone: a.tone as Tone
	}));

	const figures: Figure[] = figureRows.map((f) => ({
		id: f.id,
		name: f.name,
		initials: f.initials
	}));

	const characters: Character[] = characterRows.map((c) => ({
		id: c.id,
		workSlug: c.workSlug,
		figureId: c.figureId,
		name: c.name,
		initials: c.initials,
		...(c.photo ? { photo: c.photo } : {}),
		...(c.photoCredit ? { photoCredit: c.photoCredit } : {})
	}));

	const plotPoints: PlotPoint[] = plotPointRows.map((p) => ({
		id: p.id,
		workSlug: p.workSlug,
		characterId: p.characterId,
		arcId: p.arcId,
		at: p.at,
		text: p.text
	}));

	return { name: universe.name, sagas, works, seasons, arcs, figures, characters, plotPoints };
}

/** Alle Universen – für Startseite und `EntryGenerator`s. */
export async function listUniverses(): Promise<UniverseEntry[]> {
	const slugs = await listUniverseSlugs();
	const loaded = await Promise.all(slugs.map((slug) => loadUniverse(slug)));
	return slugs.map((slug, i) => ({ slug, universe: loaded[i]! }));
}
