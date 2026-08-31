ALTER TABLE `lead_captures` ADD `demoDedupeKey` varchar(384);--> statement-breakpoint
ALTER TABLE `lead_captures` ADD CONSTRAINT `lead_captures_demo_dedupe_uq` UNIQUE(`demoDedupeKey`);