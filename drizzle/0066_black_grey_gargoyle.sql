CREATE TABLE `sales_practice_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`situationId` int NOT NULL,
	`buyerRole` varchar(255) NOT NULL,
	`objective` text,
	`scenario` json,
	`messages` json,
	`debrief` json,
	`status` enum('active','completed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_practice_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sales_practice_sessions` ADD CONSTRAINT `sales_practice_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales_practice_sessions` ADD CONSTRAINT `sales_practice_sessions_situationId_sales_situations_id_fk` FOREIGN KEY (`situationId`) REFERENCES `sales_situations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sales_practice_sessions_user_updated_idx` ON `sales_practice_sessions` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `sales_practice_sessions_situation_idx` ON `sales_practice_sessions` (`situationId`);