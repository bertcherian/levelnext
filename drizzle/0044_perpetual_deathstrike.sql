CREATE TABLE `sim_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` varchar(20) NOT NULL,
	`missionId` varchar(100) NOT NULL,
	`missionTitle` varchar(255) NOT NULL,
	`capability` varchar(100) NOT NULL,
	`difficulty` varchar(30) NOT NULL DEFAULT 'Developing',
	`voiceEnabled` boolean NOT NULL DEFAULT false,
	`characterName` varchar(100),
	`characterRole` varchar(150),
	`transcript` json NOT NULL DEFAULT ('[]'),
	`debrief` json,
	`overallScore` int,
	`status` varchar(20) NOT NULL DEFAULT 'briefing',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sim_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sim_sessions` ADD CONSTRAINT `sim_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;