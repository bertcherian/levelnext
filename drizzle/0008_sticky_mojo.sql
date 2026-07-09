CREATE TABLE `conversation_intelligence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceApp` enum('chatgpt','claude','other') NOT NULL DEFAULT 'chatgpt',
	`summary` json,
	`themes` json,
	`totalConversations` int,
	`leadershipConversations` int,
	`dateRangeFrom` varchar(50),
	`dateRangeTo` varchar(50),
	`rawFileDeleted` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_intelligence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `conversation_intelligence` ADD CONSTRAINT `conversation_intelligence_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;