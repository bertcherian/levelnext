CREATE TABLE `identity_experiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moduleNumber` int NOT NULL,
	`experiment` text NOT NULL,
	`reflection` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `identity_experiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `next_chapter_deliverables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moduleNumber` int NOT NULL,
	`deliverableType` varchar(100) NOT NULL,
	`content` json NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `next_chapter_deliverables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `next_chapter_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`moduleNumber` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `next_chapter_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `next_chapter_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentStage` int NOT NULL DEFAULT 1,
	`currentModule` int NOT NULL DEFAULT 1,
	`completedModules` json DEFAULT ('[]'),
	`journeyCompleted` boolean NOT NULL DEFAULT false,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `next_chapter_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `next_chapter_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `identity_experiments` ADD CONSTRAINT `identity_experiments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `next_chapter_deliverables` ADD CONSTRAINT `next_chapter_deliverables_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `next_chapter_messages` ADD CONSTRAINT `next_chapter_messages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `next_chapter_profiles` ADD CONSTRAINT `next_chapter_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;