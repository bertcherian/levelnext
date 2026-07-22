CREATE TABLE `identity_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentType` enum('baseline','stage_end') NOT NULL,
	`stageNumber` int,
	`scores` json NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `identity_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `next_chapter_experiment_commitments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moduleNumber` int NOT NULL,
	`experiment` text NOT NULL,
	`acknowledgedAt` timestamp NOT NULL DEFAULT (now()),
	`reflectionNote` text,
	`reflectedAt` timestamp,
	CONSTRAINT `next_chapter_experiment_commitments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `identity_assessments` ADD CONSTRAINT `identity_assessments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `next_chapter_experiment_commitments` ADD CONSTRAINT `next_chapter_experiment_commitments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;