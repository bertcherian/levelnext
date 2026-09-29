CREATE TABLE `proof_nudge_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`participantId` int,
	`recipientType` enum('participant','sponsor') NOT NULL,
	`milestoneDay` int NOT NULL,
	`deliveryKey` varchar(180) NOT NULL,
	`deliveredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proof_nudge_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `proof_nudge_deliveries_deliveryKey_unique` UNIQUE(`deliveryKey`),
	CONSTRAINT `proof_nudge_deliveries_recipient_uq` UNIQUE(`pilotId`,`participantId`,`recipientType`,`milestoneDay`)
);
--> statement-breakpoint
CREATE TABLE `proof_participant_trust_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`participantId` int NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`response` varchar(120),
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proof_participant_trust_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proof_security_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`storageKey` varchar(500) NOT NULL,
	`storageUrl` varchar(700) NOT NULL,
	`contentType` varchar(160) NOT NULL,
	`fileSize` int NOT NULL,
	`reviewOwnerName` varchar(160),
	`reviewOwnerEmail` varchar(320),
	`status` enum('uploaded','in_review','approved','needs_action','archived') NOT NULL DEFAULT 'uploaded',
	`reviewNotes` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proof_security_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proof_security_requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`requirementKey` varchar(100) NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`status` enum('not_started','in_review','approved','blocked','not_applicable') NOT NULL DEFAULT 'not_started',
	`ownerName` varchar(160),
	`ownerEmail` varchar(320),
	`evidenceDocumentId` int,
	`reviewNote` text,
	`dueDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proof_security_requirements_id` PRIMARY KEY(`id`),
	CONSTRAINT `proof_security_requirements_pilot_key_uq` UNIQUE(`pilotId`,`requirementKey`)
);
--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `invitedAt` timestamp;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `inviteOpenedAt` timestamp;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `purposeUnderstoodAt` timestamp;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `privacyViewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `personalGoal` text;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `personalGoalAt` timestamp;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `firstValueAt` timestamp;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `trustState` enum('green','amber','red') DEFAULT 'amber' NOT NULL;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `trustConcern` varchar(255);--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `nudgePreference` enum('normal','fewer','paused') DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `lastNudgeAt` timestamp;--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `sponsorRole` varchar(160);--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `selectionRationale` text;--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `privacyConfig` json;--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `invitationSubject` varchar(240);--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `invitationMessage` text;--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `nudgeScheduleCronTaskUid` varchar(65);--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `nudgeEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `proof_nudge_deliveries` ADD CONSTRAINT `pnd_pilot_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_nudge_deliveries` ADD CONSTRAINT `pnd_participant_fk` FOREIGN KEY (`participantId`) REFERENCES `proof_pilot_participants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_participant_trust_events` ADD CONSTRAINT `ppte_pilot_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_participant_trust_events` ADD CONSTRAINT `ppte_participant_fk` FOREIGN KEY (`participantId`) REFERENCES `proof_pilot_participants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_security_documents` ADD CONSTRAINT `psd_pilot_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_security_documents` ADD CONSTRAINT `psd_uploader_fk` FOREIGN KEY (`uploadedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_security_requirements` ADD CONSTRAINT `psr_pilot_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_security_requirements` ADD CONSTRAINT `psr_document_fk` FOREIGN KEY (`evidenceDocumentId`) REFERENCES `proof_security_documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `proof_nudge_deliveries_pilot_idx` ON `proof_nudge_deliveries` (`pilotId`,`milestoneDay`);--> statement-breakpoint
CREATE INDEX `proof_trust_events_participant_idx` ON `proof_participant_trust_events` (`participantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `proof_trust_events_pilot_type_idx` ON `proof_participant_trust_events` (`pilotId`,`eventType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `proof_security_documents_pilot_idx` ON `proof_security_documents` (`pilotId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `proof_security_requirements_pilot_status_idx` ON `proof_security_requirements` (`pilotId`,`status`);--> statement-breakpoint
CREATE INDEX `proof_pilots_nudge_task_idx` ON `proof_pilots` (`nudgeScheduleCronTaskUid`);
