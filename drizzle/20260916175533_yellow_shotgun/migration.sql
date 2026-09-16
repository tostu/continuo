CREATE TABLE `seasons` (
	`universe_slug` text NOT NULL,
	`work_slug` text NOT NULL,
	`id` text NOT NULL,
	`season_number` integer NOT NULL,
	`label` text NOT NULL,
	`released` text NOT NULL,
	`chronology` real NOT NULL,
	`lore_date` text NOT NULL,
	`range_start` real NOT NULL,
	`range_end` real NOT NULL,
	`sort_order` integer NOT NULL,
	CONSTRAINT `seasons_pk` PRIMARY KEY(`universe_slug`, `work_slug`, `id`),
	CONSTRAINT `fk_seasons_universe_slug_work_slug_works_universe_slug_slug_fk` FOREIGN KEY (`universe_slug`,`work_slug`) REFERENCES `works`(`universe_slug`,`slug`)
);
