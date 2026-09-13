CREATE TABLE `arcs` (
	`universe_slug` text NOT NULL,
	`id` text NOT NULL,
	`work_slug` text NOT NULL,
	`name` text NOT NULL,
	`tone` text NOT NULL,
	`sort_order` integer NOT NULL,
	CONSTRAINT `arcs_pk` PRIMARY KEY(`universe_slug`, `id`),
	CONSTRAINT `fk_arcs_universe_slug_work_slug_works_universe_slug_slug_fk` FOREIGN KEY (`universe_slug`,`work_slug`) REFERENCES `works`(`universe_slug`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`universe_slug` text NOT NULL,
	`work_slug` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`initials` text NOT NULL,
	`sort_order` integer NOT NULL,
	CONSTRAINT `characters_pk` PRIMARY KEY(`universe_slug`, `work_slug`, `id`),
	CONSTRAINT `fk_characters_universe_slug_work_slug_works_universe_slug_slug_fk` FOREIGN KEY (`universe_slug`,`work_slug`) REFERENCES `works`(`universe_slug`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `plot_points` (
	`universe_slug` text NOT NULL,
	`id` text NOT NULL,
	`work_slug` text NOT NULL,
	`character_id` text NOT NULL,
	`arc_id` text NOT NULL,
	`at` real NOT NULL,
	`text` text NOT NULL,
	CONSTRAINT `plot_points_pk` PRIMARY KEY(`universe_slug`, `id`),
	CONSTRAINT `fk_plot_points_universe_slug_work_slug_character_id_characters_universe_slug_work_slug_id_fk` FOREIGN KEY (`universe_slug`,`work_slug`,`character_id`) REFERENCES `characters`(`universe_slug`,`work_slug`,`id`),
	CONSTRAINT `fk_plot_points_universe_slug_work_slug_arc_id_arcs_universe_slug_work_slug_id_fk` FOREIGN KEY (`universe_slug`,`work_slug`,`arc_id`) REFERENCES `arcs`(`universe_slug`,`work_slug`,`id`)
);
--> statement-breakpoint
CREATE TABLE `sagas` (
	`universe_slug` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`tone` text NOT NULL,
	`sort_order` integer NOT NULL,
	CONSTRAINT `sagas_pk` PRIMARY KEY(`universe_slug`, `id`),
	CONSTRAINT `fk_sagas_universe_slug_universes_slug_fk` FOREIGN KEY (`universe_slug`) REFERENCES `universes`(`slug`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `universes` (
	`slug` text PRIMARY KEY,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `works` (
	`universe_slug` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`short` text NOT NULL,
	`kind` text NOT NULL,
	`released` text NOT NULL,
	`chronology` real NOT NULL,
	`lore_date` text NOT NULL,
	`saga_id` text NOT NULL,
	`required` integer NOT NULL,
	`unit` text NOT NULL,
	`range_start` real NOT NULL,
	`range_end` real NOT NULL,
	`now_playing` integer,
	`cover` text,
	`sort_order` integer NOT NULL,
	CONSTRAINT `works_pk` PRIMARY KEY(`universe_slug`, `slug`),
	CONSTRAINT `fk_works_universe_slug_universes_slug_fk` FOREIGN KEY (`universe_slug`) REFERENCES `universes`(`slug`) ON DELETE CASCADE,
	CONSTRAINT `fk_works_universe_slug_saga_id_sagas_universe_slug_id_fk` FOREIGN KEY (`universe_slug`,`saga_id`) REFERENCES `sagas`(`universe_slug`,`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `arcs_universe_work_id` ON `arcs` (`universe_slug`,`work_slug`,`id`);--> statement-breakpoint
-- Demo-Tabelle aus dem Scaffold; die Daten liegen jetzt in den Universums-Tabellen.
DROP TABLE IF EXISTS `users_table`;
