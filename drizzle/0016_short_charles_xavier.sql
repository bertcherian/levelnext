CREATE TABLE `platform_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`invitedBy` int,
	`pilotApplicationId` int,
	`status` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platform_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `platform_invites` ADD CONSTRAINT `platform_invites_invitedBy_users_id_fk` FOREIGN KEY (`invitedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platform_invites` ADD CONSTRAINT `platform_invites_pilotApplicationId_pilot_applications_id_fk` FOREIGN KEY (`pilotApplicationId`) REFERENCES `pilot_applications`(`id`) ON DELETE no action ON UPDATE no action;