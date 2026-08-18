CREATE TABLE `ai_suggestion_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`surface` varchar(100) NOT NULL,
	`contentKey` varchar(160),
	`suggestionKind` varchar(100) NOT NULL,
	`reason` enum('malformed','unhelpful') NOT NULL,
	`contentSnapshot` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_suggestion_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_suggestion_feedback` ADD CONSTRAINT `ai_suggestion_feedback_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ai_suggestion_feedback_user_created_idx` ON `ai_suggestion_feedback` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ai_suggestion_feedback_surface_created_idx` ON `ai_suggestion_feedback` (`surface`,`createdAt`);