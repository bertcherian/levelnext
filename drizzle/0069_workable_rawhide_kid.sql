CREATE TABLE `early_career_cohorts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`managerUserId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `early_career_cohorts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `early_career_profiles` ADD `cohortId` int;--> statement-breakpoint
ALTER TABLE `early_career_cohorts` ADD CONSTRAINT `early_career_cohorts_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_cohorts` ADD CONSTRAINT `early_career_cohorts_managerUserId_users_id_fk` FOREIGN KEY (`managerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_cohorts` ADD CONSTRAINT `early_career_cohorts_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `early_career_cohorts_tenant_manager_idx` ON `early_career_cohorts` (`tenantId`,`managerUserId`);--> statement-breakpoint
ALTER TABLE `early_career_profiles` ADD CONSTRAINT `early_career_profiles_cohortId_early_career_cohorts_id_fk` FOREIGN KEY (`cohortId`) REFERENCES `early_career_cohorts`(`id`) ON DELETE no action ON UPDATE no action;