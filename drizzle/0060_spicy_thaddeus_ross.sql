CREATE TABLE `ic_guided_mirror_reminder_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`dayOfWeek` int NOT NULL DEFAULT 1,
	`hourUtc` int NOT NULL DEFAULT 3,
	`scheduleCronTaskUid` varchar(65),
	`lastReminderAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ic_guided_mirror_reminder_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `ic_guided_mirror_reminder_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `ic_self_leadership_mirrors` ADD `feedbackReason` varchar(120);--> statement-breakpoint
ALTER TABLE `ic_self_leadership_mirrors` ADD `ontologyPrimaryDistinctionId` varchar(64);--> statement-breakpoint
ALTER TABLE `ic_self_leadership_mirrors` ADD `ontologySecondaryDistinctionId` varchar(64);--> statement-breakpoint
ALTER TABLE `privacy_settings` ADD `shareGuidedMirrorAggregateThemes` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `privacy_settings` ADD `guidedMirrorAggregateConsentAt` timestamp;--> statement-breakpoint
ALTER TABLE `ic_guided_mirror_reminder_settings` ADD CONSTRAINT `ic_guided_mirror_reminder_settings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ic_gm_reminder_task_idx` ON `ic_guided_mirror_reminder_settings` (`scheduleCronTaskUid`);