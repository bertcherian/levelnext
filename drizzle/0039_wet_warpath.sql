CREATE TABLE `sp_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spUserId` int NOT NULL,
	`managedUserId` int NOT NULL,
	`tenantId` int,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`assignedBy` int,
	CONSTRAINT `sp_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','success_partner') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `sp_assignments` ADD CONSTRAINT `sp_assignments_spUserId_users_id_fk` FOREIGN KEY (`spUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sp_assignments` ADD CONSTRAINT `sp_assignments_managedUserId_users_id_fk` FOREIGN KEY (`managedUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sp_assignments` ADD CONSTRAINT `sp_assignments_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sp_assignments` ADD CONSTRAINT `sp_assignments_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;