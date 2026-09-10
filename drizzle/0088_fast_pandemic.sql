CREATE TABLE `bi_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moveId` int NOT NULL,
	`momentId` int NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`actionDescription` text NOT NULL,
	`personOrGroup` varchar(255),
	`dueAt` timestamp,
	`status` enum('planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
	`completionNotes` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bi_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_analysis_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`momentId` int NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`engineVersion` varchar(40) NOT NULL,
	`diagnosticLens` enum('knowing','seeing','choosing','mixed') NOT NULL,
	`primaryGap` enum('capability','judgment','self_leadership','observer','environment_system','mixed') NOT NULL,
	`primaryDistinctionId` varchar(64),
	`secondaryDistinctionId` varchar(64),
	`confidence` enum('low','moderate','high') NOT NULL,
	`analysis` json NOT NULL,
	`modelStatus` enum('success','fallback') NOT NULL,
	`fallbackReason` varchar(120),
	`traceId` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_analysis_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`momentId` int NOT NULL,
	`moveId` int,
	`actionId` int,
	`tenantId` int,
	`userId` int NOT NULL,
	`sourceType` enum('self_report','simulator_behaviour','practice_attempt','real_world_outcome','stakeholder_feedback') NOT NULL DEFAULT 'self_report',
	`situation` text NOT NULL,
	`actionTaken` text NOT NULL,
	`outcome` text NOT NULL,
	`learning` text NOT NULL,
	`evidenceLevel` enum('prepared','practised','applied','reflected','repeated','demonstrated_consistently') NOT NULL DEFAULT 'applied',
	`verificationStatus` enum('unverified','pending','verified','disputed') NOT NULL DEFAULT 'unverified',
	`verifiedByUserId` int,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bi_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_moments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`sourceApp` varchar(80) NOT NULL DEFAULT 'behavioural_intelligence',
	`sourceEntityType` varchar(80),
	`sourceEntityId` int,
	`moduleType` varchar(50),
	`situation` text NOT NULL,
	`desiredOutcome` text,
	`observedBehaviour` text,
	`role` varchar(255),
	`careerStage` enum('early_career','professional','manager','leader','cxo') NOT NULL DEFAULT 'manager',
	`authorityLevel` varchar(160),
	`stakeholders` text,
	`organisationalContext` text,
	`culturalContext` text,
	`powerDynamics` text,
	`consequences` text,
	`evidence` json,
	`diagnosticContext` json,
	`status` enum('draft','analysed','in_practice','in_action','completed','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bi_moments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_moves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`momentId` int NOT NULL,
	`analysisSnapshotId` int,
	`tenantId` int,
	`userId` int NOT NULL,
	`moveCode` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`suggestedLanguage` json,
	`successSignal` text NOT NULL,
	`doNotDo` json,
	`recommendedDepth` varchar(40) NOT NULL DEFAULT 'D2_practice',
	`status` enum('proposed','selected','practised','committed','applied','dismissed') NOT NULL DEFAULT 'proposed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bi_moves_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_practice_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moveId` int NOT NULL,
	`momentId` int NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`providerType` varchar(60) NOT NULL,
	`providerSessionId` int,
	`attemptNumber` int NOT NULL DEFAULT 1,
	`scenarioContext` json,
	`practiceStatus` enum('planned','in_progress','completed','abandoned') NOT NULL DEFAULT 'planned',
	`feedbackScores` json,
	`evidenceLevel` enum('prepared','practised','applied','reflected','repeated','demonstrated_consistently') NOT NULL DEFAULT 'prepared',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bi_practice_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bi_reflections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evidenceId` int NOT NULL,
	`momentId` int NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`reflectionText` text NOT NULL,
	`capacitySignal` text,
	`oldPatternShift` text,
	`newPossibility` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bi_reflections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bi_actions` ADD CONSTRAINT `bi_actions_moveId_bi_moves_id_fk` FOREIGN KEY (`moveId`) REFERENCES `bi_moves`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_actions` ADD CONSTRAINT `bi_actions_momentId_bi_moments_id_fk` FOREIGN KEY (`momentId`) REFERENCES `bi_moments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_actions` ADD CONSTRAINT `bi_actions_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_actions` ADD CONSTRAINT `bi_actions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_analysis_snapshots` ADD CONSTRAINT `bi_analysis_snapshots_momentId_bi_moments_id_fk` FOREIGN KEY (`momentId`) REFERENCES `bi_moments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_analysis_snapshots` ADD CONSTRAINT `bi_analysis_snapshots_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_analysis_snapshots` ADD CONSTRAINT `bi_analysis_snapshots_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_evidence` ADD CONSTRAINT `bi_evidence_momentId_bi_moments_id_fk` FOREIGN KEY (`momentId`) REFERENCES `bi_moments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_evidence` ADD CONSTRAINT `bi_evidence_moveId_bi_moves_id_fk` FOREIGN KEY (`moveId`) REFERENCES `bi_moves`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_evidence` ADD CONSTRAINT `bi_evidence_actionId_bi_actions_id_fk` FOREIGN KEY (`actionId`) REFERENCES `bi_actions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_evidence` ADD CONSTRAINT `bi_evidence_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_evidence` ADD CONSTRAINT `bi_evidence_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_evidence` ADD CONSTRAINT `bi_evidence_verifiedByUserId_users_id_fk` FOREIGN KEY (`verifiedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_moments` ADD CONSTRAINT `bi_moments_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_moments` ADD CONSTRAINT `bi_moments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_moves` ADD CONSTRAINT `bi_moves_momentId_bi_moments_id_fk` FOREIGN KEY (`momentId`) REFERENCES `bi_moments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_moves` ADD CONSTRAINT `bi_moves_analysisSnapshotId_bi_analysis_snapshots_id_fk` FOREIGN KEY (`analysisSnapshotId`) REFERENCES `bi_analysis_snapshots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_moves` ADD CONSTRAINT `bi_moves_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_moves` ADD CONSTRAINT `bi_moves_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_practice_links` ADD CONSTRAINT `bi_practice_links_moveId_bi_moves_id_fk` FOREIGN KEY (`moveId`) REFERENCES `bi_moves`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_practice_links` ADD CONSTRAINT `bi_practice_links_momentId_bi_moments_id_fk` FOREIGN KEY (`momentId`) REFERENCES `bi_moments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_practice_links` ADD CONSTRAINT `bi_practice_links_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_practice_links` ADD CONSTRAINT `bi_practice_links_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_reflections` ADD CONSTRAINT `bi_reflections_evidenceId_bi_evidence_id_fk` FOREIGN KEY (`evidenceId`) REFERENCES `bi_evidence`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_reflections` ADD CONSTRAINT `bi_reflections_momentId_bi_moments_id_fk` FOREIGN KEY (`momentId`) REFERENCES `bi_moments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_reflections` ADD CONSTRAINT `bi_reflections_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bi_reflections` ADD CONSTRAINT `bi_reflections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `bi_actions_moment_status_idx` ON `bi_actions` (`momentId`,`status`);--> statement-breakpoint
CREATE INDEX `bi_actions_user_idx` ON `bi_actions` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `bi_snapshots_moment_idx` ON `bi_analysis_snapshots` (`momentId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `bi_snapshots_user_idx` ON `bi_analysis_snapshots` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `bi_evidence_moment_level_idx` ON `bi_evidence` (`momentId`,`evidenceLevel`);--> statement-breakpoint
CREATE INDEX `bi_evidence_user_idx` ON `bi_evidence` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `bi_moments_user_idx` ON `bi_moments` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `bi_moments_tenant_source_idx` ON `bi_moments` (`tenantId`,`sourceApp`);--> statement-breakpoint
CREATE INDEX `bi_moves_moment_status_idx` ON `bi_moves` (`momentId`,`status`);--> statement-breakpoint
CREATE INDEX `bi_moves_user_idx` ON `bi_moves` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `bi_practice_move_idx` ON `bi_practice_links` (`moveId`,`attemptNumber`);--> statement-breakpoint
CREATE INDEX `bi_practice_user_idx` ON `bi_practice_links` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `bi_reflections_evidence_idx` ON `bi_reflections` (`evidenceId`);--> statement-breakpoint
CREATE INDEX `bi_reflections_user_idx` ON `bi_reflections` (`userId`,`createdAt`);