CREATE TABLE `ei_work_diary_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`activityTitle` varchar(255) NOT NULL,
	`category` enum('strategic_thinking','people_development','stakeholder_leadership','decision_making','operational_execution','meetings_coordination','administrative_reporting','firefighting_reactive') NOT NULL,
	`hours` float NOT NULL,
	`workAtLevel` enum('below_level','at_level','above_level_strategic') NOT NULL DEFAULT 'at_level',
	`reallocation` enum('eliminate','simplify','automate','autonomize','augment','elevate') NOT NULL DEFAULT 'simplify',
	`outcome` text,
	`notes` text,
	`privacyClass` enum('participant_private','development') NOT NULL DEFAULT 'participant_private',
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ei_work_diary_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ei_work_diary_entries` ADD CONSTRAINT `ei_work_diary_entries_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_work_diary_entries` ADD CONSTRAINT `ei_work_diary_entries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ei_diary_user_date_idx` ON `ei_work_diary_entries` (`userId`,`dateKey`);--> statement-breakpoint
CREATE INDEX `ei_diary_tenant_date_idx` ON `ei_work_diary_entries` (`tenantId`,`dateKey`);