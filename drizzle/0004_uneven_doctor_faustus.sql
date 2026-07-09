CREATE TABLE `diagnostic_unlock_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`fromModule` enum('ECI','LII','GCC') NOT NULL,
	`toModule` enum('ECI','LII','GCC') NOT NULL,
	`fromCompletedAt` timestamp NOT NULL,
	`timegatePassedAt` timestamp,
	`missionsCompleted` int NOT NULL DEFAULT 0,
	`guideSessionsCompleted` int NOT NULL DEFAULT 0,
	`commitmentSet` boolean NOT NULL DEFAULT false,
	`focusDimension` varchar(255),
	`allGatesPassedAt` timestamp,
	`narrativeShown` boolean NOT NULL DEFAULT false,
	`unlockedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diagnostic_unlock_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guide_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moduleType` enum('ECI','LII','GCC','GENERAL') NOT NULL DEFAULT 'GENERAL',
	`conversationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guide_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `diagnostic_unlock_progress` ADD CONSTRAINT `diagnostic_unlock_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diagnostic_unlock_progress` ADD CONSTRAINT `diagnostic_unlock_progress_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guide_sessions` ADD CONSTRAINT `guide_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guide_sessions` ADD CONSTRAINT `guide_sessions_conversationId_guide_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `guide_conversations`(`id`) ON DELETE no action ON UPDATE no action;