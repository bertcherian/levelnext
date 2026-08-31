CREATE TABLE `ei_agent_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`actorUserId` int,
	`subjectUserId` int,
	`agentCode` varchar(100) NOT NULL,
	`purposeCode` varchar(120) NOT NULL,
	`triggerType` varchar(80) NOT NULL,
	`status` enum('running','succeeded','fallback','failed','denied') NOT NULL DEFAULT 'running',
	`inputManifest` json NOT NULL,
	`modelId` varchar(120),
	`traceId` varchar(100) NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ei_agent_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ei_diagnostic_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`questionCode` varchar(120) NOT NULL,
	`answerValue` int NOT NULL,
	`answeredAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ei_diagnostic_responses_id` PRIMARY KEY(`id`),
	CONSTRAINT `ei_diagnostic_responses_session_question_uq` UNIQUE(`sessionId`,`questionCode`)
);
--> statement-breakpoint
CREATE TABLE `ei_diagnostic_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`diagnosticVersion` varchar(80) NOT NULL,
	`engineScores` json NOT NULL,
	`impactRadius` enum('self','team','system','organisation') NOT NULL,
	`impactPattern` varchar(160) NOT NULL,
	`growthEdge` json NOT NULL,
	`scoringMethodVersion` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ei_diagnostic_results_id` PRIMARY KEY(`id`),
	CONSTRAINT `ei_diagnostic_results_session_uq` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `ei_diagnostic_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`diagnosticVersion` varchar(80) NOT NULL,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`currentQuestionIndex` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ei_diagnostic_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ei_engineer_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`roleTitle` varchar(180),
	`discipline` varchar(120),
	`engineeringLevel` varchar(120),
	`aspiration` varchar(180),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ei_engineer_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `ei_engineer_profiles_owner_uq` UNIQUE(`tenantId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `ei_missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`sourceResultId` int,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`status` enum('recommended','accepted','preparing','ready_to_act','attempted','complete','deferred','declined') NOT NULL DEFAULT 'recommended',
	`dueAt` timestamp,
	`acceptedAt` timestamp,
	`attemptedAt` timestamp,
	`completedAt` timestamp,
	`partnerVisible` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ei_missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ei_partner_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`partnerUserId` int NOT NULL,
	`participantUserId` int NOT NULL,
	`status` enum('active','paused','ended') NOT NULL DEFAULT 'active',
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ei_partner_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `ei_partner_assignments_pair_status_uq` UNIQUE(`tenantId`,`partnerUserId`,`participantUserId`,`status`)
);
--> statement-breakpoint
CREATE TABLE `ei_partner_check_ins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`partnerUserId` int NOT NULL,
	`participantUserId` int NOT NULL,
	`nudgeId` int,
	`channel` enum('in_app','call','voice_note','email','in_person') NOT NULL,
	`summaryShared` text NOT NULL,
	`nextStep` text,
	`followUpAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ei_partner_check_ins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ei_partner_nudges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`partnerUserId` int NOT NULL,
	`participantUserId` int NOT NULL,
	`missionId` int NOT NULL,
	`agentRunId` int,
	`reasonCode` enum('mission_due','mission_stalled','follow_up_due','celebration') NOT NULL,
	`objective` text NOT NULL,
	`whyNow` text NOT NULL,
	`suggestedQuestion` text NOT NULL,
	`recommendedChannel` enum('in_app','call','voice_note','email') NOT NULL,
	`effort` enum('low','medium','high') NOT NULL,
	`urgency` enum('low','medium','high','critical') NOT NULL,
	`priorityScore` int NOT NULL,
	`permittedContextKeys` json NOT NULL,
	`status` enum('pending','opened','contacted','completed','snoozed','skipped','dismissed') NOT NULL DEFAULT 'pending',
	`dedupeKey` varchar(180) NOT NULL,
	`snoozedUntil` timestamp,
	`openedAt` timestamp,
	`contactedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ei_partner_nudges_id` PRIMARY KEY(`id`),
	CONSTRAINT `ei_partner_nudges_dedupe_uq` UNIQUE(`dedupeKey`)
);
--> statement-breakpoint
ALTER TABLE `ei_agent_runs` ADD CONSTRAINT `ei_agent_runs_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_agent_runs` ADD CONSTRAINT `ei_agent_runs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_agent_runs` ADD CONSTRAINT `ei_agent_runs_subjectUserId_users_id_fk` FOREIGN KEY (`subjectUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_diagnostic_responses` ADD CONSTRAINT `ei_diagnostic_responses_sessionId_ei_diagnostic_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `ei_diagnostic_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_diagnostic_responses` ADD CONSTRAINT `ei_diagnostic_responses_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_diagnostic_responses` ADD CONSTRAINT `ei_diagnostic_responses_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_diagnostic_results` ADD CONSTRAINT `ei_diagnostic_results_sessionId_ei_diagnostic_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `ei_diagnostic_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_diagnostic_results` ADD CONSTRAINT `ei_diagnostic_results_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_diagnostic_results` ADD CONSTRAINT `ei_diagnostic_results_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_diagnostic_sessions` ADD CONSTRAINT `ei_diagnostic_sessions_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_diagnostic_sessions` ADD CONSTRAINT `ei_diagnostic_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_engineer_profiles` ADD CONSTRAINT `ei_engineer_profiles_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_engineer_profiles` ADD CONSTRAINT `ei_engineer_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_missions` ADD CONSTRAINT `ei_missions_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_missions` ADD CONSTRAINT `ei_missions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_missions` ADD CONSTRAINT `ei_missions_sourceResultId_ei_diagnostic_results_id_fk` FOREIGN KEY (`sourceResultId`) REFERENCES `ei_diagnostic_results`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_partner_assignments` ADD CONSTRAINT `ei_partner_assignments_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_partner_assignments` ADD CONSTRAINT `ei_partner_assignments_partnerUserId_users_id_fk` FOREIGN KEY (`partnerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_partner_assignments` ADD CONSTRAINT `ei_partner_assignments_participantUserId_users_id_fk` FOREIGN KEY (`participantUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_partner_check_ins` ADD CONSTRAINT `ei_partner_check_ins_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_partner_check_ins` ADD CONSTRAINT `ei_partner_check_ins_partnerUserId_users_id_fk` FOREIGN KEY (`partnerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_partner_check_ins` ADD CONSTRAINT `ei_partner_check_ins_participantUserId_users_id_fk` FOREIGN KEY (`participantUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_partner_nudges` ADD CONSTRAINT `ei_partner_nudges_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_partner_nudges` ADD CONSTRAINT `ei_partner_nudges_partnerUserId_users_id_fk` FOREIGN KEY (`partnerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_partner_nudges` ADD CONSTRAINT `ei_partner_nudges_participantUserId_users_id_fk` FOREIGN KEY (`participantUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_partner_nudges` ADD CONSTRAINT `ei_partner_nudges_missionId_ei_missions_id_fk` FOREIGN KEY (`missionId`) REFERENCES `ei_missions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_partner_nudges` ADD CONSTRAINT `ei_partner_nudges_agentRunId_ei_agent_runs_id_fk` FOREIGN KEY (`agentRunId`) REFERENCES `ei_agent_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ei_agent_runs_agent_created_idx` ON `ei_agent_runs` (`tenantId`,`agentCode`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ei_diagnostic_responses_owner_idx` ON `ei_diagnostic_responses` (`tenantId`,`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ei_diagnostic_results_owner_idx` ON `ei_diagnostic_results` (`tenantId`,`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ei_diagnostic_sessions_owner_idx` ON `ei_diagnostic_sessions` (`tenantId`,`userId`,`status`);--> statement-breakpoint
CREATE INDEX `ei_missions_owner_status_idx` ON `ei_missions` (`tenantId`,`userId`,`status`);--> statement-breakpoint
CREATE INDEX `ei_missions_visible_queue_idx` ON `ei_missions` (`tenantId`,`partnerVisible`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `ei_partner_assignments_partner_idx` ON `ei_partner_assignments` (`tenantId`,`partnerUserId`,`status`);--> statement-breakpoint
CREATE INDEX `ei_partner_check_ins_partner_idx` ON `ei_partner_check_ins` (`tenantId`,`partnerUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ei_partner_check_ins_participant_idx` ON `ei_partner_check_ins` (`tenantId`,`participantUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ei_partner_nudges_queue_idx` ON `ei_partner_nudges` (`tenantId`,`partnerUserId`,`status`,`priorityScore`);