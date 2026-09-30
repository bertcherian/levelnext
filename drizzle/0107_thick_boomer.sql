CREATE TABLE `proof_sponsor_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`ownerUserId` int NOT NULL,
	`kind` varchar(80) NOT NULL,
	`title` varchar(180) NOT NULL,
	`message` text NOT NULL,
	`href` varchar(500),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proof_sponsor_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `proof_sponsor_notifications` ADD CONSTRAINT `proof_sponsor_notifications_pilotId_proof_pilots_id_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_sponsor_notifications` ADD CONSTRAINT `proof_sponsor_notifications_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `proof_sponsor_notifications_owner_idx` ON `proof_sponsor_notifications` (`ownerUserId`,`readAt`,`createdAt`);--> statement-breakpoint
CREATE INDEX `proof_sponsor_notifications_pilot_idx` ON `proof_sponsor_notifications` (`pilotId`,`createdAt`);