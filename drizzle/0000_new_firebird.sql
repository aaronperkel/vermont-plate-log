CREATE TABLE `sightings` (
	`id` text PRIMARY KEY NOT NULL,
	`plate` text NOT NULL,
	`ordinal` integer NOT NULL,
	`spotted_by` text NOT NULL,
	`spotted_at` text NOT NULL,
	`location` text,
	`notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sightings_plate_idx` ON `sightings` (`plate`);--> statement-breakpoint
CREATE INDEX `sightings_ordinal_idx` ON `sightings` (`ordinal`);