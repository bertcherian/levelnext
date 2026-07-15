CREATE TABLE `playbook_patterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`situationFrequency` json,
	`competencySignals` json,
	`avoidedSituations` json,
	`recurringChallenges` json,
	`totalSessions` int NOT NULL DEFAULT 0,
	`totalReflections` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playbook_patterns_id` PRIMARY KEY(`id`),
	CONSTRAINT `playbook_patterns_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `playbook_reflections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`whatHappened` text,
	`whatSurprised` text,
	`whatWorked` text,
	`whatDidnt` text,
	`whatToChange` text,
	`outcome` varchar(20),
	`reflectionInsight` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playbook_reflections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playbook_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`situationText` text NOT NULL,
	`classification` json,
	`playbookType` varchar(100),
	`playbookContent` json,
	`conversationDone` boolean NOT NULL DEFAULT false,
	`checklistState` json,
	`scriptEdits` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playbook_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `playbook_patterns` ADD CONSTRAINT `playbook_patterns_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playbook_reflections` ADD CONSTRAINT `playbook_reflections_sessionId_playbook_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `playbook_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playbook_reflections` ADD CONSTRAINT `playbook_reflections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playbook_sessions` ADD CONSTRAINT `playbook_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;