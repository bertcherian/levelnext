CREATE TABLE `pilotlab_predicate_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`eventId` int NOT NULL,
	`dimension` varchar(80) NOT NULL,
	`predicateId` varchar(120) NOT NULL,
	`passed` boolean NOT NULL,
	`expected` text NOT NULL,
	`observed` text NOT NULL,
	`releaseGateCode` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pilotlab_predicate_results_id` PRIMARY KEY(`id`),
	CONSTRAINT `pilotlab_predicate_event_id_uq` UNIQUE(`eventId`,`predicateId`)
);
--> statement-breakpoint
CREATE TABLE `pilotlab_release_gates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`gateCode` varchar(64) NOT NULL,
	`state` enum('not_triggered','handled','regressed') NOT NULL,
	`triggered` int NOT NULL DEFAULT 0,
	`handled` int NOT NULL DEFAULT 0,
	`regressed` int NOT NULL DEFAULT 0,
	`rationale` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pilotlab_release_gates_id` PRIMARY KEY(`id`),
	CONSTRAINT `pilotlab_gate_run_code_uq` UNIQUE(`runId`,`gateCode`)
);
--> statement-breakpoint
CREATE TABLE `proof_participant_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`participantId` int NOT NULL,
	`consentVersion` varchar(32) NOT NULL,
	`participationConsentedAt` timestamp NOT NULL,
	`privacyAcknowledgedAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proof_participant_consents_id` PRIMARY KEY(`id`),
	CONSTRAINT `proof_participant_consent_uq` UNIQUE(`pilotId`,`participantId`)
);
--> statement-breakpoint
CREATE TABLE `proof_pilot_baseline_measures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`measureKey` varchar(100) NOT NULL,
	`label` varchar(180) NOT NULL,
	`baselineValue` float NOT NULL,
	`targetValue` float,
	`unit` varchar(80) NOT NULL,
	`source` varchar(180) NOT NULL,
	`definition` text NOT NULL,
	`recordedByUserId` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proof_pilot_baseline_measures_id` PRIMARY KEY(`id`),
	CONSTRAINT `proof_baseline_measure_pilot_key_uq` UNIQUE(`pilotId`,`measureKey`)
);
--> statement-breakpoint
CREATE TABLE `proof_pilot_day30_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`reviewedByUserId` int NOT NULL,
	`status` enum('draft','completed') NOT NULL DEFAULT 'draft',
	`decision` enum('continue_controlled','extend_pilot','prepare_scale_review','stop') NOT NULL DEFAULT 'continue_controlled',
	`summary` text NOT NULL,
	`evidenceBoundaryAcknowledged` boolean NOT NULL DEFAULT false,
	`reviewedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proof_pilot_day30_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `proof_pilot_day30_reviews_pilotId_unique` UNIQUE(`pilotId`)
);
--> statement-breakpoint
CREATE TABLE `proof_pilot_governance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pilotId` int NOT NULL,
	`sponsorConsentVersion` varchar(32) NOT NULL,
	`sponsorConsentedAt` timestamp NOT NULL,
	`dataBoundaryAcknowledged` boolean NOT NULL DEFAULT false,
	`baselinePlanAcknowledged` boolean NOT NULL DEFAULT false,
	`reviewOwnerName` varchar(160),
	`reviewOwnerEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proof_pilot_governance_id` PRIMARY KEY(`id`),
	CONSTRAINT `proof_pilot_governance_pilotId_unique` UNIQUE(`pilotId`)
);
--> statement-breakpoint
ALTER TABLE `pilotlab_results` ADD `checked` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `pilotlab_predicate_results` ADD CONSTRAINT `pilotlab_predicate_results_runId_pilotlab_runs_id_fk` FOREIGN KEY (`runId`) REFERENCES `pilotlab_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pilotlab_predicate_results` ADD CONSTRAINT `pilotlab_predicate_results_eventId_pilotlab_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `pilotlab_events`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pilotlab_release_gates` ADD CONSTRAINT `pilotlab_release_gates_runId_pilotlab_runs_id_fk` FOREIGN KEY (`runId`) REFERENCES `pilotlab_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_participant_consents` ADD CONSTRAINT `proof_participant_consents_pilotId_proof_pilots_id_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_participant_consents` ADD CONSTRAINT `proof_part_consent_participant_fk` FOREIGN KEY (`participantId`) REFERENCES `proof_pilot_participants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_pilot_baseline_measures` ADD CONSTRAINT `proof_pilot_baseline_measures_pilotId_proof_pilots_id_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_pilot_baseline_measures` ADD CONSTRAINT `proof_pilot_baseline_measures_recordedByUserId_users_id_fk` FOREIGN KEY (`recordedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_pilot_day30_reviews` ADD CONSTRAINT `proof_pilot_day30_reviews_pilotId_proof_pilots_id_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_pilot_day30_reviews` ADD CONSTRAINT `proof_pilot_day30_reviews_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proof_pilot_governance` ADD CONSTRAINT `proof_pilot_governance_pilotId_proof_pilots_id_fk` FOREIGN KEY (`pilotId`) REFERENCES `proof_pilots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pilotlab_predicate_run_dimension_idx` ON `pilotlab_predicate_results` (`runId`,`dimension`,`passed`);--> statement-breakpoint
CREATE INDEX `pilotlab_gate_run_state_idx` ON `pilotlab_release_gates` (`runId`,`state`);--> statement-breakpoint
CREATE INDEX `proof_participant_consent_pilot_idx` ON `proof_participant_consents` (`pilotId`,`revokedAt`);--> statement-breakpoint
CREATE INDEX `proof_baseline_measure_pilot_idx` ON `proof_pilot_baseline_measures` (`pilotId`,`recordedAt`);--> statement-breakpoint
CREATE INDEX `proof_day30_review_status_idx` ON `proof_pilot_day30_reviews` (`status`,`reviewedAt`);--> statement-breakpoint
CREATE INDEX `proof_governance_review_owner_idx` ON `proof_pilot_governance` (`reviewOwnerEmail`);
