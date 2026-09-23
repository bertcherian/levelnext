CREATE TABLE `manager_altitude_intakes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`answers` json NOT NULL,
	`altitude` enum('foundation','building','scaling','multiplying') NOT NULL,
	`score` int NOT NULL,
	`focus` text NOT NULL,
	`explanation` text NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manager_altitude_intakes_id` PRIMARY KEY(`id`),
	CONSTRAINT `manager_altitude_intakes_user_uq` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `manager_altitude_intakes` ADD CONSTRAINT `manager_altitude_intakes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `manager_altitude_intakes_completed_idx` ON `manager_altitude_intakes` (`completedAt`);