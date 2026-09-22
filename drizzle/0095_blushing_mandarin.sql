CREATE TABLE `persona_builder_checkins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repId` int NOT NULL,
	`journeyId` int NOT NULL,
	`userId` int NOT NULL,
	`opportunityStatus` enum('arose','did_not_arise','unclear') NOT NULL,
	`executionStatus` enum('yes','partly','no','not_applicable') NOT NULL,
	`reflection` text,
	`outcome` text,
	`evidenceId` int,
	`nextAction` enum('keep_rep','repeat_with_adjustment','increase_difficulty','simplify_and_practice') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `persona_builder_checkins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `persona_builder_commitments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journeyId` int NOT NULL,
	`userId` int NOT NULL,
	`statement` text NOT NULL,
	`observableBehavior` text NOT NULL,
	`provenance` json NOT NULL,
	`status` enum('active','retired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `persona_builder_commitments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `persona_builder_episodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journeyId` int NOT NULL,
	`userId` int NOT NULL,
	`episodeText` text NOT NULL,
	`provenance` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `persona_builder_episodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `persona_builder_journeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`momentId` int NOT NULL,
	`sourceApp` varchar(80) NOT NULL DEFAULT 'persona_builder',
	`status` enum('active','paused','completed','abandoned') NOT NULL DEFAULT 'active',
	`currentStage` enum('discovery','pattern','commitment','persona','rep','evidence','completed') NOT NULL DEFAULT 'discovery',
	`integrationStatus` enum('scaffold_needed','scaffold_can_be_activated','less_activation_needed','increasingly_natural','integrated') NOT NULL DEFAULT 'scaffold_needed',
	`activePersonaId` int,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`targetEndAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `persona_builder_journeys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `persona_builder_pattern_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journeyId` int NOT NULL,
	`userId` int NOT NULL,
	`version` int NOT NULL,
	`pattern` json NOT NULL,
	`modelStatus` enum('success','fallback') NOT NULL,
	`fallbackReason` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `persona_builder_pattern_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `persona_builder_personas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journeyId` int NOT NULL,
	`userId` int NOT NULL,
	`candidateIndex` int NOT NULL,
	`persona` json NOT NULL,
	`status` enum('proposed','selected','retired') NOT NULL DEFAULT 'proposed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `persona_builder_personas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `persona_builder_reps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journeyId` int NOT NULL,
	`momentId` int NOT NULL,
	`userId` int NOT NULL,
	`personaId` int,
	`commitmentId` int NOT NULL,
	`instruction` text NOT NULL,
	`trigger` text NOT NULL,
	`successSignal` text NOT NULL,
	`fallbackIfUnsafe` text NOT NULL,
	`difficulty` int NOT NULL DEFAULT 1,
	`status` enum('active','completed','retired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `persona_builder_reps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `persona_builder_checkins` ADD CONSTRAINT `pb_ci_rep_fk` FOREIGN KEY (`repId`) REFERENCES `persona_builder_reps`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_checkins` ADD CONSTRAINT `pb_ci_journey_fk` FOREIGN KEY (`journeyId`) REFERENCES `persona_builder_journeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_checkins` ADD CONSTRAINT `pb_ci_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_checkins` ADD CONSTRAINT `pb_ci_evidence_fk` FOREIGN KEY (`evidenceId`) REFERENCES `bi_evidence`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_commitments` ADD CONSTRAINT `pb_com_journey_fk` FOREIGN KEY (`journeyId`) REFERENCES `persona_builder_journeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_commitments` ADD CONSTRAINT `pb_com_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_episodes` ADD CONSTRAINT `pb_ep_journey_fk` FOREIGN KEY (`journeyId`) REFERENCES `persona_builder_journeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_episodes` ADD CONSTRAINT `pb_ep_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_journeys` ADD CONSTRAINT `pb_j_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_journeys` ADD CONSTRAINT `pb_j_tenant_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_journeys` ADD CONSTRAINT `pb_j_moment_fk` FOREIGN KEY (`momentId`) REFERENCES `bi_moments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_pattern_snapshots` ADD CONSTRAINT `pb_ps_journey_fk` FOREIGN KEY (`journeyId`) REFERENCES `persona_builder_journeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_pattern_snapshots` ADD CONSTRAINT `pb_ps_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_personas` ADD CONSTRAINT `pb_p_journey_fk` FOREIGN KEY (`journeyId`) REFERENCES `persona_builder_journeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_personas` ADD CONSTRAINT `pb_p_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_reps` ADD CONSTRAINT `pb_r_journey_fk` FOREIGN KEY (`journeyId`) REFERENCES `persona_builder_journeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_reps` ADD CONSTRAINT `pb_r_moment_fk` FOREIGN KEY (`momentId`) REFERENCES `bi_moments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_reps` ADD CONSTRAINT `pb_r_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_reps` ADD CONSTRAINT `pb_r_persona_fk` FOREIGN KEY (`personaId`) REFERENCES `persona_builder_personas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `persona_builder_reps` ADD CONSTRAINT `pb_r_commit_fk` FOREIGN KEY (`commitmentId`) REFERENCES `persona_builder_commitments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `persona_builder_checkins_rep_idx` ON `persona_builder_checkins` (`repId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `persona_builder_checkins_user_idx` ON `persona_builder_checkins` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `persona_builder_commitments_journey_idx` ON `persona_builder_commitments` (`journeyId`,`status`);--> statement-breakpoint
CREATE INDEX `persona_builder_commitments_user_idx` ON `persona_builder_commitments` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `persona_builder_episodes_journey_idx` ON `persona_builder_episodes` (`journeyId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `persona_builder_episodes_user_idx` ON `persona_builder_episodes` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `persona_builder_journeys_user_status_idx` ON `persona_builder_journeys` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `persona_builder_journeys_tenant_idx` ON `persona_builder_journeys` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `persona_builder_patterns_journey_idx` ON `persona_builder_pattern_snapshots` (`journeyId`,`version`);--> statement-breakpoint
CREATE INDEX `persona_builder_patterns_user_idx` ON `persona_builder_pattern_snapshots` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `persona_builder_personas_journey_idx` ON `persona_builder_personas` (`journeyId`,`status`);--> statement-breakpoint
CREATE INDEX `persona_builder_personas_user_idx` ON `persona_builder_personas` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `persona_builder_reps_journey_status_idx` ON `persona_builder_reps` (`journeyId`,`status`);--> statement-breakpoint
CREATE INDEX `persona_builder_reps_user_idx` ON `persona_builder_reps` (`userId`,`createdAt`);
