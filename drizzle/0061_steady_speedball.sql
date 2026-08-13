ALTER TABLE `ic_guided_mirror_reminder_settings` ADD `localDayOfWeek` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `ic_guided_mirror_reminder_settings` ADD `localHour` int DEFAULT 9 NOT NULL;--> statement-breakpoint
ALTER TABLE `ic_guided_mirror_reminder_settings` ADD `timeZone` varchar(80) DEFAULT 'UTC' NOT NULL;