CREATE TABLE `ei_behavior_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunityScanId` int,
	`tenantId` int,
	`userId` int NOT NULL,
	`behaviorTitle` varchar(255) NOT NULL,
	`targetCategory` varchar(80) NOT NULL,
	`currentPattern` text NOT NULL,
	`desiredBehavior` text NOT NULL,
	`whyItMatters` text NOT NULL,
	`realWorldMoment` text NOT NULL,
	`targetEvidence` text NOT NULL,
	`ontologicalDistinction` varchar(120),
	`limitingNarrative` text,
	`status` enum('selected','practising','active_in_work','verified_shift','deferred') NOT NULL DEFAULT 'selected',
	`targetCompletionDate` timestamp,
	`achievedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ei_behavior_contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ei_capacity_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanId` int NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`currentAllocation` json NOT NULL,
	`targetAllocation` json NOT NULL,
	`recoverableHours` float NOT NULL,
	`workBelowLevelHours` float NOT NULL,
	`workBelowLevelPercent` int NOT NULL,
	`gapScore` int NOT NULL,
	`hiddenManagerTaxHours` float NOT NULL DEFAULT 0,
	`hiddenManagerTaxAnnualCost` float NOT NULL DEFAULT 0,
	`largestDeficitCategory` varchar(80),
	`largestSurplusCategory` varchar(80),
	`confidence` enum('high_measured','moderate_reported','exploratory_hypothesis') NOT NULL DEFAULT 'moderate_reported',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ei_capacity_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ei_evidence_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`actionId` int,
	`tenantId` int,
	`userId` int NOT NULL,
	`evidenceLevel` enum('L1_insight','L2_practice','L3_commitment','L4_application','L5_repetition','L6_external_observation','L7_business_effect') NOT NULL,
	`claimType` enum('fact','inference','hypothesis') NOT NULL DEFAULT 'fact',
	`situation` text NOT NULL,
	`actionTaken` text NOT NULL,
	`observedOutcome` text NOT NULL,
	`capacityHoursRecovered` float NOT NULL DEFAULT 0,
	`stakeholderConfirmed` boolean NOT NULL DEFAULT false,
	`reflectionNotes` text,
	`privacyClass` enum('participant_private','development','sponsor_reportable') NOT NULL DEFAULT 'development',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ei_evidence_claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ei_next_best_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int,
	`tenantId` int,
	`userId` int NOT NULL,
	`actionType` enum('do_nothing','micro_reflection','ontological_distinction','simulation_practice','real_world_commitment','delegation_transfer','meeting_redesign','stakeholder_alignment','coaching_conversation','human_coach_escalation') NOT NULL,
	`headline` varchar(255) NOT NULL,
	`reason` text NOT NULL,
	`preparationPrompt` text,
	`expectedBenefit` text,
	`suggestedDurationMinutes` int NOT NULL DEFAULT 10,
	`effortLevel` enum('low','moderate','high') NOT NULL DEFAULT 'low',
	`urgencyLevel` enum('today','this_week','upcoming') NOT NULL DEFAULT 'this_week',
	`status` enum('proposed','accepted','completed','dismissed') NOT NULL DEFAULT 'proposed',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ei_next_best_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ei_opportunity_scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanId` int NOT NULL,
	`capacitySnapshotId` int,
	`tenantId` int,
	`userId` int NOT NULL,
	`headline` text NOT NULL,
	`coreBottleneck` text NOT NULL,
	`recommendedBehaviors` json NOT NULL,
	`strategicLeverageSummary` text,
	`traceId` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ei_opportunity_scans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ei_work_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanId` int NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` enum('strategic_thinking','people_development','stakeholder_leadership','decision_making','operational_execution','meetings_coordination','administrative_reporting','firefighting_reactive') NOT NULL,
	`weeklyHours` float NOT NULL,
	`frequency` varchar(100) NOT NULL DEFAULT 'weekly',
	`workAtLevel` enum('below_level','at_level','above_level_strategic') NOT NULL DEFAULT 'at_level',
	`reallocation` enum('eliminate','simplify','automate','autonomize','augment','elevate') NOT NULL DEFAULT 'simplify',
	`decisionLevel` varchar(100),
	`judgmentRequirement` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`delegationPotential` enum('none','partial','full') NOT NULL DEFAULT 'none',
	`aiAugmentationPotential` enum('none','drafting','analysis','full') NOT NULL DEFAULT 'none',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ei_work_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ei_work_scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`altitude` enum('manager','senior_leader','executive') NOT NULL DEFAULT 'manager',
	`totalWorkHours` float NOT NULL DEFAULT 45,
	`status` enum('in_progress','completed','archived') NOT NULL DEFAULT 'in_progress',
	`contextNotes` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ei_work_scans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ei_behavior_contracts` ADD CONSTRAINT `fk_ei_beha_cont_oppo_ei_oppo_scan_id_kfnb2x_fk` FOREIGN KEY (`opportunityScanId`) REFERENCES `ei_opportunity_scans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_behavior_contracts` ADD CONSTRAINT `fk_ei_beha_cont_tena_tena_id_r9i8bp_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_behavior_contracts` ADD CONSTRAINT `fk_ei_beha_cont_user_user_id_cag0g5_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_capacity_snapshots` ADD CONSTRAINT `fk_ei_capa_snap_scan_ei_work_scan_id_xzswas_fk` FOREIGN KEY (`scanId`) REFERENCES `ei_work_scans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_capacity_snapshots` ADD CONSTRAINT `fk_ei_capa_snap_tena_tena_id_s5069b_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_capacity_snapshots` ADD CONSTRAINT `fk_ei_capa_snap_user_user_id_imenl_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_evidence_claims` ADD CONSTRAINT `fk_ei_evid_clai_cont_ei_beha_cont_id_da7an2_fk` FOREIGN KEY (`contractId`) REFERENCES `ei_behavior_contracts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_evidence_claims` ADD CONSTRAINT `fk_ei_evid_clai_acti_ei_next_best_acti_id_p37j8s_fk` FOREIGN KEY (`actionId`) REFERENCES `ei_next_best_actions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_evidence_claims` ADD CONSTRAINT `fk_ei_evid_clai_tena_tena_id_1et8k0_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_evidence_claims` ADD CONSTRAINT `fk_ei_evid_clai_user_user_id_n19hsg_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_next_best_actions` ADD CONSTRAINT `fk_ei_next_best_acti_cont_ei_beha_cont_id_xuz1ip_fk` FOREIGN KEY (`contractId`) REFERENCES `ei_behavior_contracts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_next_best_actions` ADD CONSTRAINT `fk_ei_next_best_acti_tena_tena_id_qgkrk1_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_next_best_actions` ADD CONSTRAINT `fk_ei_next_best_acti_user_user_id_onemlb_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_opportunity_scans` ADD CONSTRAINT `fk_ei_oppo_scan_scan_ei_work_scan_id_je3i3y_fk` FOREIGN KEY (`scanId`) REFERENCES `ei_work_scans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_opportunity_scans` ADD CONSTRAINT `fk_ei_oppo_scan_capa_ei_capa_snap_id_39df8r_fk` FOREIGN KEY (`capacitySnapshotId`) REFERENCES `ei_capacity_snapshots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_opportunity_scans` ADD CONSTRAINT `fk_ei_oppo_scan_tena_tena_id_ogquyj_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_opportunity_scans` ADD CONSTRAINT `fk_ei_oppo_scan_user_user_id_m2gzfp_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_work_activities` ADD CONSTRAINT `fk_ei_work_acti_scan_ei_work_scan_id_dq3noh_fk` FOREIGN KEY (`scanId`) REFERENCES `ei_work_scans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_work_activities` ADD CONSTRAINT `fk_ei_work_acti_tena_tena_id_sc282c_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_work_activities` ADD CONSTRAINT `fk_ei_work_acti_user_user_id_5b3m2c_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_work_scans` ADD CONSTRAINT `fk_ei_work_scan_tena_tena_id_xlv9sf_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_work_scans` ADD CONSTRAINT `fk_ei_work_scan_user_user_id_9uq6jz_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ei_contracts_user_idx` ON `ei_behavior_contracts` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `ei_contracts_tenant_idx` ON `ei_behavior_contracts` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `ei_capacity_user_idx` ON `ei_capacity_snapshots` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ei_capacity_scan_idx` ON `ei_capacity_snapshots` (`scanId`);--> statement-breakpoint
CREATE INDEX `ei_evidence_contract_idx` ON `ei_evidence_claims` (`contractId`,`evidenceLevel`);--> statement-breakpoint
CREATE INDEX `ei_evidence_user_idx` ON `ei_evidence_claims` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ei_nbla_user_status_idx` ON `ei_next_best_actions` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `ei_nbla_contract_idx` ON `ei_next_best_actions` (`contractId`);--> statement-breakpoint
CREATE INDEX `ei_opportunity_user_idx` ON `ei_opportunity_scans` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ei_opportunity_scan_idx` ON `ei_opportunity_scans` (`scanId`);--> statement-breakpoint
CREATE INDEX `ei_activities_scan_idx` ON `ei_work_activities` (`scanId`,`category`);--> statement-breakpoint
CREATE INDEX `ei_activities_user_idx` ON `ei_work_activities` (`userId`,`workAtLevel`);--> statement-breakpoint
CREATE INDEX `ei_work_scans_user_idx` ON `ei_work_scans` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ei_work_scans_tenant_idx` ON `ei_work_scans` (`tenantId`,`status`);