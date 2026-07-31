CREATE TABLE `launch_interview_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`interviewType` enum('hr','behavioural','technical','case','presentation') NOT NULL,
	`targetRole` varchar(255),
	`targetCompany` varchar(255),
	`interviewDifficulty` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
	`messages` json NOT NULL,
	`overallScore` int,
	`dimensionScores` json,
	`feedback` json,
	`xpEarned` int NOT NULL DEFAULT 0,
	`interviewStatus` enum('in_progress','completed') NOT NULL DEFAULT 'in_progress',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launch_interview_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `launch_negotiation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scenarioId` varchar(100) NOT NULL,
	`scenarioTitle` varchar(255) NOT NULL,
	`targetRole` varchar(255),
	`targetCompany` varchar(255),
	`initialOffer` varchar(100),
	`messages` json NOT NULL,
	`finalOutcome` varchar(255),
	`outcomeScore` int,
	`feedback` json,
	`xpEarned` int NOT NULL DEFAULT 0,
	`negotiationStatus` enum('in_progress','completed') NOT NULL DEFAULT 'in_progress',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launch_negotiation_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `launch_interview_sessions` ADD CONSTRAINT `launch_interview_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `launch_negotiation_sessions` ADD CONSTRAINT `launch_negotiation_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;