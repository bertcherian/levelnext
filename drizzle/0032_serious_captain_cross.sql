CREATE TABLE `interview_prep_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetRole` varchar(255) NOT NULL,
	`targetCompany` varchar(255) NOT NULL,
	`interviewType` varchar(50) NOT NULL DEFAULT 'behavioral',
	`jobDescription` text,
	`yourBackground` text,
	`prepData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interview_prep_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `negotiation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(255) NOT NULL,
	`company` varchar(255) NOT NULL,
	`offeredSalary` varchar(50),
	`offeredBonus` varchar(100),
	`offeredEquity` varchar(100),
	`otherBenefits` text,
	`currentSalary` varchar(50),
	`targetSalary` varchar(50),
	`marketContext` text,
	`yourLeverage` text,
	`strategyData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `negotiation_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `interview_prep_sessions` ADD CONSTRAINT `interview_prep_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `negotiation_sessions` ADD CONSTRAINT `negotiation_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;