-- Figuren bekommen eine werkübergreifende Identität. Der zusammengesetzte Fremdschlüssel
-- auf `figures` zwingt SQLite, `characters` neu anzulegen. Die Auftritte lassen sich nicht
-- sinnvoll übernehmen (es gibt noch keine `figure_id`), deshalb wird geleert: seed.sql ist
-- die Datenquelle und muss direkt nach dieser Migration eingespielt werden.
PRAGMA defer_foreign_keys = on;--> statement-breakpoint
CREATE TABLE `figures` (
	`universe_slug` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`initials` text NOT NULL,
	`sort_order` integer NOT NULL,
	CONSTRAINT `figures_pk` PRIMARY KEY(`universe_slug`, `id`),
	CONSTRAINT `fk_figures_universe_slug_universes_slug_fk` FOREIGN KEY (`universe_slug`) REFERENCES `universes`(`slug`) ON DELETE CASCADE
);
--> statement-breakpoint
DELETE FROM `plot_points`;--> statement-breakpoint
DELETE FROM `characters`;--> statement-breakpoint
CREATE TABLE `__new_characters` (
	`universe_slug` text NOT NULL,
	`work_slug` text NOT NULL,
	`id` text NOT NULL,
	`figure_id` text NOT NULL,
	`name` text NOT NULL,
	`initials` text NOT NULL,
	`photo` text,
	`photo_credit` text,
	`sort_order` integer NOT NULL,
	CONSTRAINT `characters_pk` PRIMARY KEY(`universe_slug`, `work_slug`, `id`),
	CONSTRAINT `fk_characters_universe_slug_work_slug_works_universe_slug_slug_fk` FOREIGN KEY (`universe_slug`,`work_slug`) REFERENCES `works`(`universe_slug`,`slug`),
	CONSTRAINT `fk_characters_universe_slug_figure_id_figures_universe_slug_id_fk` FOREIGN KEY (`universe_slug`,`figure_id`) REFERENCES `figures`(`universe_slug`,`id`)
);
--> statement-breakpoint
DROP TABLE `characters`;--> statement-breakpoint
ALTER TABLE `__new_characters` RENAME TO `characters`;--> statement-breakpoint
PRAGMA defer_foreign_keys = off;
