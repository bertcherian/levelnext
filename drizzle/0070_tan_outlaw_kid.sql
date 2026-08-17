CREATE TABLE `model_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdByUserId` int NOT NULL,
	`systemPrompt` text NOT NULL,
	`userPrompt` text NOT NULL,
	`maxTokens` int NOT NULL,
	`temperature` float NOT NULL,
	`status` enum('completed','partial') NOT NULL,
	`claudeModel` varchar(100) NOT NULL,
	`claudeResponse` text,
	`claudeError` text,
	`claudeLatencyMs` int,
	`claudeUsage` json,
	`qwenModel` varchar(100) NOT NULL,
	`qwenResponse` text,
	`qwenError` text,
	`qwenLatencyMs` int,
	`qwenUsage` json,
	`preferredModel` enum('claude','qwen','tie','neither'),
	`reviewScores` json,
	`reviewerNote` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `model_evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `model_evaluations` ADD CONSTRAINT `model_evaluations_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_evaluations` ADD CONSTRAINT `model_evaluations_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `model_evaluations_created_idx` ON `model_evaluations` (`createdAt`);--> statement-breakpoint
CREATE INDEX `model_evaluations_creator_idx` ON `model_evaluations` (`createdByUserId`);