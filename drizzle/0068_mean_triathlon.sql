CREATE TABLE `early_career_saved_practice_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`title` varchar(160) NOT NULL,
	`context` text NOT NULL,
	`counterpartRole` varchar(120) NOT NULL,
	`objective` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `early_career_saved_practice_scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `early_career_saved_practice_scenarios` ADD CONSTRAINT `early_career_saved_practice_scenarios_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_saved_practice_scenarios` ADD CONSTRAINT `early_career_saved_practice_scenarios_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `early_career_saved_practice_user_updated_idx` ON `early_career_saved_practice_scenarios` (`userId`,`updatedAt`);