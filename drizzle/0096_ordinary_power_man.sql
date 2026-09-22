CREATE TABLE `persona_builder_completion_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journeyId` int NOT NULL,
	`userId` int NOT NULL,
	`overallShift` text NOT NULL,
	`whatChanged` text NOT NULL,
	`whatDidNotChange` text NOT NULL,
	`nextExperiment` text NOT NULL,
	`rating` int NOT NULL,
	`nextChoice` enum('continue_persona','retire_persona','switch_intervention','pause') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `persona_builder_completion_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `persona_builder_days` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journeyId` int NOT NULL,
	`userId` int NOT NULL,
	`dayNumber` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`focus` text NOT NULL,
	`status` enum('locked','in_progress','complete','skipped') NOT NULL DEFAULT 'locked',
	`repId` int,
	`practiceSessionId` int,
	`simulatorSessionId` int,
	`evidenceCount` int NOT NULL DEFAULT 0,
	`adaptation` json,
	`completionNote` text,
	`availableAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `persona_builder_days_id` PRIMARY KEY(`id`),
	CONSTRAINT `persona_builder_days_journey_day_uq` UNIQUE(`journeyId`,`dayNumber`)
);
--> statement-breakpoint
ALTER TABLE `mep_practice_sessions` ADD `personaRepId` int;--> statement-breakpoint
ALTER TABLE `mep_practice_sessions` ADD `personaJourneyId` int;--> statement-breakpoint
ALTER TABLE `mep_practice_sessions` ADD `personaDayNumber` int;--> statement-breakpoint
ALTER TABLE `persona_builder_reps` ADD `dayNumber` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `sim_sessions` ADD `personaRepId` int;--> statement-breakpoint
ALTER TABLE `sim_sessions` ADD `personaJourneyId` int;--> statement-breakpoint
ALTER TABLE `sim_sessions` ADD `personaDayNumber` int;--> statement-breakpoint
ALTER TABLE `persona_builder_completion_reviews` ADD CONSTRAINT `pbc_review_journey_fk` FOREIGN KEY (`journeyId`) REFERENCES `persona_builder_journeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_completion_reviews` ADD CONSTRAINT `pbc_review_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_days` ADD CONSTRAINT `pbc_day_journey_fk` FOREIGN KEY (`journeyId`) REFERENCES `persona_builder_journeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_days` ADD CONSTRAINT `pbc_day_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `persona_builder_reviews_journey_idx` ON `persona_builder_completion_reviews` (`journeyId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `persona_builder_reviews_user_idx` ON `persona_builder_completion_reviews` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `persona_builder_days_user_status_idx` ON `persona_builder_days` (`userId`,`status`);
