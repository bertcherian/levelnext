CREATE TABLE `proof_mobile_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`participantId` int,
	`eventType` varchar(80) NOT NULL,
	`source` varchar(40) NOT NULL,
	`isMobile` boolean NOT NULL DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proof_mobile_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proof_pilot_access_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`participantId` int NOT NULL,
	`token` varchar(96) NOT NULL,
	`tokenType` enum('qr_join') NOT NULL DEFAULT 'qr_join',
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proof_pilot_access_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `proof_pilot_access_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `proof_pilot_qr_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`token` varchar(96) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`scanCount` int NOT NULL DEFAULT 0,
	`lastScannedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proof_pilot_qr_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `proof_pilot_qr_links_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `proof_mobile_events` ADD CONSTRAINT `proof_mobile_events_pilot_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_mobile_events` ADD CONSTRAINT `proof_mobile_events_participant_fk` FOREIGN KEY (`participantId`) REFERENCES `proof_pilot_participants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_pilot_access_tokens` ADD CONSTRAINT `proof_access_tokens_pilot_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_pilot_access_tokens` ADD CONSTRAINT `proof_access_tokens_participant_fk` FOREIGN KEY (`participantId`) REFERENCES `proof_pilot_participants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_pilot_qr_links` ADD CONSTRAINT `proof_qr_links_pilot_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_pilot_qr_links` ADD CONSTRAINT `proof_qr_links_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `proof_mobile_events_pilot_type_idx` ON `proof_mobile_events` (`pilotId`,`eventType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `proof_mobile_events_participant_idx` ON `proof_mobile_events` (`participantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `proof_access_tokens_participant_idx` ON `proof_pilot_access_tokens` (`participantId`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `proof_access_tokens_pilot_idx` ON `proof_pilot_access_tokens` (`pilotId`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `proof_qr_links_pilot_idx` ON `proof_pilot_qr_links` (`pilotId`,`revokedAt`);--> statement-breakpoint
CREATE INDEX `proof_qr_links_expiry_idx` ON `proof_pilot_qr_links` (`expiresAt`);
