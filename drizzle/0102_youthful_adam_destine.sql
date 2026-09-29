CREATE TABLE `proof_observations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`participantId` int NOT NULL,
	`source` enum('system','behavioural','human','business_signal') NOT NULL,
	`observationType` varchar(80) NOT NULL,
	`summary` text NOT NULL,
	`outcomeSignal` text,
	`evidenceLevel` int NOT NULL DEFAULT 1,
	`privacyScope` enum('private','sponsor_aggregate') NOT NULL DEFAULT 'private',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proof_observations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proof_pilot_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(160),
	`role` enum('participant','observer') NOT NULL DEFAULT 'participant',
	`inviteToken` varchar(96) NOT NULL,
	`inviteStatus` enum('pending','opened','active','completed') NOT NULL DEFAULT 'pending',
	`baselineCompletedAt` timestamp,
	`firstRepAt` timestamp,
	`firstRealWorkAt` timestamp,
	`lastActivityAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proof_pilot_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `proof_pilot_participants_inviteToken_unique` UNIQUE(`inviteToken`),
	CONSTRAINT `proof_participants_pilot_email_uq` UNIQUE(`pilotId`,`email`)
);
--> statement-breakpoint
CREATE TABLE `proof_pilots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`companyContext` varchar(255),
	`businessProblem` text NOT NULL,
	`targetBehaviours` json NOT NULL,
	`observableActions` json NOT NULL,
	`businessSignals` json NOT NULL,
	`durationDays` int NOT NULL DEFAULT 30,
	`baselineMethod` varchar(160) NOT NULL,
	`nudgeCadence` varchar(160) NOT NULL,
	`observerPulse` varchar(160) NOT NULL,
	`status` enum('draft','active','completed','paused') NOT NULL DEFAULT 'draft',
	`launchedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proof_pilots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `proof_observations` ADD CONSTRAINT `proof_observations_pilotId_proof_pilots_id_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_observations` ADD CONSTRAINT `proof_observations_participantId_proof_pilot_participants_id_fk` FOREIGN KEY (`participantId`) REFERENCES `proof_pilot_participants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD CONSTRAINT `proof_pilot_participants_pilotId_proof_pilots_id_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD CONSTRAINT `proof_pilots_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `proof_observations_pilot_created_idx` ON `proof_observations` (`pilotId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `proof_observations_pilot_source_idx` ON `proof_observations` (`pilotId`,`source`);--> statement-breakpoint
CREATE INDEX `proof_participants_pilot_status_idx` ON `proof_pilot_participants` (`pilotId`,`inviteStatus`);--> statement-breakpoint
CREATE INDEX `proof_pilots_owner_created_idx` ON `proof_pilots` (`ownerUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `proof_pilots_status_idx` ON `proof_pilots` (`status`,`updatedAt`);