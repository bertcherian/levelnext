CREATE TABLE `momentum_partner_calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`calledAt` timestamp,
	`commitmentText` text,
	`commitmentId` int,
	`outcome` enum('implemented','partial','not_implemented','no_show'),
	`leaderConfidence` int,
	`callNotes` text,
	`blockerMentioned` text,
	`escalateToCoach` boolean NOT NULL DEFAULT false,
	`suggestedOpening` text,
	`status` enum('scheduled','completed','missed') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `momentum_partner_calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `momentum_partner_calls` ADD CONSTRAINT `momentum_partner_calls_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `momentum_partner_calls` ADD CONSTRAINT `momentum_partner_calls_commitmentId_commitments_id_fk` FOREIGN KEY (`commitmentId`) REFERENCES `commitments`(`id`) ON DELETE no action ON UPDATE no action;