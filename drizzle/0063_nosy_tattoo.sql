CREATE TABLE `executive_decision_review_reminder_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`localDayOfWeek` int NOT NULL DEFAULT 1,
	`localHour` int NOT NULL DEFAULT 9,
	`timeZone` varchar(80) NOT NULL DEFAULT 'UTC',
	`scheduleCronTaskUid` varchar(65),
	`lastReminderAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `executive_decision_review_reminder_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `executive_decision_review_reminder_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `executive_decision_review_reminder_settings` ADD CONSTRAINT `executive_decision_review_reminder_settings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `executive_decision_review_task_idx` ON `executive_decision_review_reminder_settings` (`scheduleCronTaskUid`);