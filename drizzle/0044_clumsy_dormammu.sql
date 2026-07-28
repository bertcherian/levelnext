CREATE TABLE `sim_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` varchar(50) NOT NULL,
	`userPrompt` text NOT NULL,
	`conversationType` varchar(100),
	`stakeholder` varchar(100),
	`objective` text,
	`expectedChallenge` text,
	`difficulty` int DEFAULT 3,
	`estimatedMinutes` int DEFAULT 6,
	`characterName` varchar(100),
	`characterStyle` varchar(100),
	`messages` json DEFAULT ('[]'),
	`status` varchar(20) DEFAULT 'active',
	`overallScore` int,
	`behaviourScores` json,
	`strengths` json,
	`improvements` json,
	`coachingInsights` json,
	`keyTakeaway` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `sim_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sim_sessions` ADD CONSTRAINT `sim_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;