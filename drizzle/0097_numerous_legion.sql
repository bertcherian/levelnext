CREATE TABLE `persona_builder_certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journeyId` int NOT NULL,
	`userId` int NOT NULL,
	`certificateCode` varchar(40) NOT NULL,
	`recipientName` varchar(255) NOT NULL,
	`journeyTitle` varchar(255) NOT NULL,
	`completedDays` int NOT NULL,
	`evidenceCount` int NOT NULL,
	`rating` int NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `persona_builder_certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `persona_builder_certificates_certificateCode_unique` UNIQUE(`certificateCode`),
	CONSTRAINT `persona_builder_certificate_journey_uq` UNIQUE(`journeyId`)
);
--> statement-breakpoint
CREATE TABLE `persona_builder_coach_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journeyId` int NOT NULL,
	`userId` int NOT NULL,
	`consented` boolean NOT NULL DEFAULT false,
	`consentVersion` varchar(64) NOT NULL,
	`coachEmail` varchar(320),
	`consentedAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `persona_builder_coach_consents_id` PRIMARY KEY(`id`),
	CONSTRAINT `persona_builder_coach_consent_journey_uq` UNIQUE(`journeyId`)
);
--> statement-breakpoint
CREATE TABLE `persona_builder_coach_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journeyId` int NOT NULL,
	`userId` int NOT NULL,
	`consentId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `persona_builder_coach_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `persona_builder_coach_shares_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `persona_builder_reminder_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`localHour` int NOT NULL DEFAULT 9,
	`timeZone` varchar(80) NOT NULL DEFAULT 'UTC',
	`scheduleCronTaskUid` varchar(65),
	`lastReminderAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `persona_builder_reminder_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `persona_builder_reminder_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `persona_builder_certificates` ADD CONSTRAINT `pbc_cert_journey_fk` FOREIGN KEY (`journeyId`) REFERENCES `persona_builder_journeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_certificates` ADD CONSTRAINT `pbc_cert_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_coach_consents` ADD CONSTRAINT `pbc_consent_journey_fk` FOREIGN KEY (`journeyId`) REFERENCES `persona_builder_journeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_coach_consents` ADD CONSTRAINT `pbc_consent_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_coach_shares` ADD CONSTRAINT `pbc_share_journey_fk` FOREIGN KEY (`journeyId`) REFERENCES `persona_builder_journeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_coach_shares` ADD CONSTRAINT `pbc_share_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_coach_shares` ADD CONSTRAINT `pbc_share_consent_fk` FOREIGN KEY (`consentId`) REFERENCES `persona_builder_coach_consents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_reminder_settings` ADD CONSTRAINT `pbc_reminder_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `persona_builder_certificate_user_idx` ON `persona_builder_certificates` (`userId`,`issuedAt`);--> statement-breakpoint
CREATE INDEX `persona_builder_coach_consent_user_idx` ON `persona_builder_coach_consents` (`userId`,`consented`);--> statement-breakpoint
CREATE INDEX `persona_builder_coach_share_journey_idx` ON `persona_builder_coach_shares` (`journeyId`,`revokedAt`);--> statement-breakpoint
CREATE INDEX `persona_builder_coach_share_user_idx` ON `persona_builder_coach_shares` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `persona_builder_reminder_task_idx` ON `persona_builder_reminder_settings` (`scheduleCronTaskUid`);
