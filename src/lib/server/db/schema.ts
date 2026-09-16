/**
 * Universums-Daten in D1. Gespiegelt von src/lib/universe/types.ts.
 *
 * IDs sind nur *innerhalb* eines Universums eindeutig (`luke` könnte in zwei Universen
 * vorkommen), deshalb ist überall `universeSlug` Teil des Schlüssels und jeder Fremd-
 * schlüssel zusammengesetzt.
 *
 * `sortOrder` hält die Reihenfolge fest, in der die UI die Einträge zeigt – Saga-Legende
 * auf der Startseite, Arc-Legende und die ersten sechs Figuren im Zoom-Beispiel. Plot
 * Points brauchen keine, die werden nach `at` sortiert.
 */
import {
	sqliteTable,
	text,
	integer,
	real,
	primaryKey,
	foreignKey,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';

export const universes = sqliteTable('universes', {
	slug: text('slug').primaryKey(),
	name: text('name').notNull(),
	/** Reihenfolge der Universen auf der Startseite. */
	sortOrder: integer('sort_order').notNull()
});

export const sagas = sqliteTable(
	'sagas',
	{
		universeSlug: text('universe_slug')
			.notNull()
			.references(() => universes.slug, { onDelete: 'cascade' }),
		id: text('id').notNull(),
		name: text('name').notNull(),
		tone: text('tone').notNull(),
		sortOrder: integer('sort_order').notNull()
	},
	(t) => [primaryKey({ columns: [t.universeSlug, t.id] })]
);

export const works = sqliteTable(
	'works',
	{
		universeSlug: text('universe_slug')
			.notNull()
			.references(() => universes.slug, { onDelete: 'cascade' }),
		slug: text('slug').notNull(),
		title: text('title').notNull(),
		short: text('short').notNull(),
		kind: text('kind').notNull(),
		/** ISO-Datum der Erstveröffentlichung. */
		released: text('released').notNull(),
		/** Position in der In-Universe-Chronologie, nicht das Erscheinungsdatum. */
		chronology: real('chronology').notNull(),
		loreDate: text('lore_date').notNull(),
		sagaId: text('saga_id').notNull(),
		required: integer('required', { mode: 'boolean' }).notNull(),
		/** Einheit der werkinternen Achse: Filmminute oder Folge. */
		unit: text('unit').notNull(),
		rangeStart: real('range_start').notNull(),
		rangeEnd: real('range_end').notNull(),
		nowPlaying: integer('now_playing', { mode: 'boolean' }),
		sortOrder: integer('sort_order').notNull()
	},
	(t) => [
		primaryKey({ columns: [t.universeSlug, t.slug] }),
		foreignKey({
			columns: [t.universeSlug, t.sagaId],
			foreignColumns: [sagas.universeSlug, sagas.id]
		})
	]
);

export const seasons = sqliteTable(
	'seasons',
	{
		universeSlug: text('universe_slug').notNull(),
		workSlug: text('work_slug').notNull(),
		id: text('id').notNull(),
		seasonNumber: integer('season_number').notNull(),
		label: text('label').notNull(),
		released: text('released').notNull(),
		/** Eigene Chronologie-Position, unabhängig von der des Werks. */
		chronology: real('chronology').notNull(),
		loreDate: text('lore_date').notNull(),
		/** Teilbereich der werkinternen Achse (`works.range_start`..`range_end`). */
		rangeStart: real('range_start').notNull(),
		rangeEnd: real('range_end').notNull(),
		/** Überschreibt saga_id des Werks, falls eine Serie über mehrere Ären hinweg läuft. */
		sagaId: text('saga_id'),
		sortOrder: integer('sort_order').notNull()
	},
	(t) => [
		primaryKey({ columns: [t.universeSlug, t.workSlug, t.id] }),
		foreignKey({
			columns: [t.universeSlug, t.workSlug],
			foreignColumns: [works.universeSlug, works.slug]
		})
	]
);

export const arcs = sqliteTable(
	'arcs',
	{
		universeSlug: text('universe_slug').notNull(),
		id: text('id').notNull(),
		workSlug: text('work_slug').notNull(),
		name: text('name').notNull(),
		tone: text('tone').notNull(),
		sortOrder: integer('sort_order').notNull()
	},
	(t) => [
		primaryKey({ columns: [t.universeSlug, t.id] }),
		// Nur damit plot_points den Arc *zusammen mit dem Werk* referenzieren kann;
		// (universeSlug, id) ist bereits eindeutig.
		uniqueIndex('arcs_universe_work_id').on(t.universeSlug, t.workSlug, t.id),
		foreignKey({
			columns: [t.universeSlug, t.workSlug],
			foreignColumns: [works.universeSlug, works.slug]
		})
	]
);

export const characters = sqliteTable(
	'characters',
	{
		universeSlug: text('universe_slug').notNull(),
		workSlug: text('work_slug').notNull(),
		id: text('id').notNull(),
		name: text('name').notNull(),
		initials: text('initials').notNull(),
		photo: text('photo'),
		photoCredit: text('photo_credit'),
		sortOrder: integer('sort_order').notNull()
	},
	(t) => [
		// Figuren-URLs sind /[universum]/werk/[werk]/figur/[figur] – eindeutig je Werk reicht.
		primaryKey({ columns: [t.universeSlug, t.workSlug, t.id] }),
		foreignKey({
			columns: [t.universeSlug, t.workSlug],
			foreignColumns: [works.universeSlug, works.slug]
		})
	]
);

export const plotPoints = sqliteTable(
	'plot_points',
	{
		universeSlug: text('universe_slug').notNull(),
		id: text('id').notNull(),
		workSlug: text('work_slug').notNull(),
		characterId: text('character_id').notNull(),
		arcId: text('arc_id').notNull(),
		/** Position auf der Werkachse (Minute oder Folgennummer). */
		at: real('at').notNull(),
		text: text('text').notNull()
	},
	(t) => [
		primaryKey({ columns: [t.universeSlug, t.id] }),
		// Bindet Figur *und* Werk in einem Schlüssel – eine Figur aus einem anderen Werk
		// kann so gar nicht referenziert werden.
		foreignKey({
			columns: [t.universeSlug, t.workSlug, t.characterId],
			foreignColumns: [characters.universeSlug, characters.workSlug, characters.id]
		}),
		// Ebenso für den Arc: ein Arc aus einem anderen Werk ist nicht referenzierbar.
		foreignKey({
			columns: [t.universeSlug, t.workSlug, t.arcId],
			foreignColumns: [arcs.universeSlug, arcs.workSlug, arcs.id]
		})
	]
);
