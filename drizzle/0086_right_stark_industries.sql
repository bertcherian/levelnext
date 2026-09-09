CREATE TABLE `ni_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`narrativeId` int,
	`experimentId` int,
	`userId` int NOT NULL,
	`tenantId` int,
	`sourceType` enum('self_report','simulator_behaviour','practice_attempt','real_world_outcome','stakeholder_feedback') NOT NULL,
	`sourceReferenceId` int,
	`situation` text NOT NULL,
	`trigger` varchar(255),
	`oldPrediction` text,
	`actionTaken` text NOT NULL,
	`outcome` text NOT NULL,
	`learning` text NOT NULL,
	`identityImplication` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ni_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ni_experiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`narrativeId` int NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`title` varchar(255) NOT NULL,
	`contextSituation` text NOT NULL,
	`oldAssumption` text NOT NULL,
	`alternativeHypothesis` text NOT NULL,
	`behaviourToTest` text NOT NULL,
	`predictedOutcome` text NOT NULL,
	`predictedProbability` int NOT NULL DEFAULT 70,
	`experimentType` enum('real_world','simulator','practice') NOT NULL DEFAULT 'real_world',
	`status` enum('planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
	`targetDate` timestamp,
	`actualOutcome` text,
	`whatRealityTaught` text,
	`narrativeImpact` enum('strongly_challenged','partly_challenged','confirmed_old','inconclusive'),
	`convictionShiftOld` int,
	`convictionShiftEmerging` int,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ni_experiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ni_narratives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`category` enum('self','relational','work_world','future') NOT NULL,
	`statement` text NOT NULL,
	`status` enum('keep','expand','test','retire','create') NOT NULL DEFAULT 'test',
	`sourceModule` varchar(50) NOT NULL DEFAULT 'mep',
	`participantResonance` enum('strongly_resonates','partly_resonates','does_not_resonate','explore','edit','dismiss') NOT NULL DEFAULT 'explore',
	`participantReflection` text,
	`historicalStrength` text,
	`currentCost` text,
	`emergingAssumption` text,
	`convictionScore` int,
	`isHighPriority` boolean NOT NULL DEFAULT false,
	`factDescription` text,
	`storyInterpretation` text,
	`predictionMade` text,
	`evidenceFor` json,
	`evidenceAgainst` json,
	`exceptionHunt` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ni_narratives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ni_operating_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`currentRole` varchar(180),
	`currentRoleTransition` varchar(180),
	`fromIdentity` varchar(180),
	`toIdentity` varchar(180),
	`emergingAssumption` text,
	`commitments` json,
	`futureSelfNarrative` text,
	`status` enum('onboarding','active','completed','refreshed') NOT NULL DEFAULT 'active',
	`currentWeek` int NOT NULL DEFAULT 1,
	`completedWeeks` json,
	`activeNarrativeCount` int NOT NULL DEFAULT 0,
	`experimentCount` int NOT NULL DEFAULT 0,
	`evidenceCount` int NOT NULL DEFAULT 0,
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ni_operating_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `ni_profiles_user_uq` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `ni_reset_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`triggerSituation` text NOT NULL,
	`noticeStory` text NOT NULL,
	`separateFacts` text NOT NULL,
	`alternativeView` text NOT NULL,
	`chosenAssumption` text NOT NULL,
	`immediateAction` text NOT NULL,
	`savedAsEvidence` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ni_reset_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ni_sharing_grants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`recipientRole` enum('success_partner','coach','manager') NOT NULL,
	`recipientUserId` int,
	`shareNextChapter` boolean NOT NULL DEFAULT true,
	`shareBehaviours` boolean NOT NULL DEFAULT true,
	`shareExperimentCount` boolean NOT NULL DEFAULT true,
	`shareEvidenceSummary` boolean NOT NULL DEFAULT true,
	`shareSupportRequest` text,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ni_sharing_grants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ni_evidence` ADD CONSTRAINT `ni_evidence_profileId_ni_operating_profiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `ni_operating_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_evidence` ADD CONSTRAINT `ni_evidence_narrativeId_ni_narratives_id_fk` FOREIGN KEY (`narrativeId`) REFERENCES `ni_narratives`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_evidence` ADD CONSTRAINT `ni_evidence_experimentId_ni_experiments_id_fk` FOREIGN KEY (`experimentId`) REFERENCES `ni_experiments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_evidence` ADD CONSTRAINT `ni_evidence_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_evidence` ADD CONSTRAINT `ni_evidence_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_experiments` ADD CONSTRAINT `ni_experiments_profileId_ni_operating_profiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `ni_operating_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_experiments` ADD CONSTRAINT `ni_experiments_narrativeId_ni_narratives_id_fk` FOREIGN KEY (`narrativeId`) REFERENCES `ni_narratives`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_experiments` ADD CONSTRAINT `ni_experiments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_experiments` ADD CONSTRAINT `ni_experiments_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_narratives` ADD CONSTRAINT `ni_narratives_profileId_ni_operating_profiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `ni_operating_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_narratives` ADD CONSTRAINT `ni_narratives_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_narratives` ADD CONSTRAINT `ni_narratives_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_operating_profiles` ADD CONSTRAINT `ni_operating_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_operating_profiles` ADD CONSTRAINT `ni_operating_profiles_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_reset_logs` ADD CONSTRAINT `ni_reset_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_reset_logs` ADD CONSTRAINT `ni_reset_logs_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_sharing_grants` ADD CONSTRAINT `ni_sharing_grants_profileId_ni_operating_profiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `ni_operating_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_sharing_grants` ADD CONSTRAINT `ni_sharing_grants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_sharing_grants` ADD CONSTRAINT `ni_sharing_grants_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ni_sharing_grants` ADD CONSTRAINT `ni_sharing_grants_recipientUserId_users_id_fk` FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ni_evidence_profile_idx` ON `ni_evidence` (`profileId`,`sourceType`);--> statement-breakpoint
CREATE INDEX `ni_evidence_user_idx` ON `ni_evidence` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ni_experiments_user_status_idx` ON `ni_experiments` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `ni_experiments_narrative_idx` ON `ni_experiments` (`narrativeId`);--> statement-breakpoint
CREATE INDEX `ni_narratives_profile_idx` ON `ni_narratives` (`profileId`,`status`);--> statement-breakpoint
CREATE INDEX `ni_narratives_user_idx` ON `ni_narratives` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `ni_profiles_tenant_user_idx` ON `ni_operating_profiles` (`tenantId`,`userId`);--> statement-breakpoint
CREATE INDEX `ni_reset_user_idx` ON `ni_reset_logs` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ni_sharing_user_idx` ON `ni_sharing_grants` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `ni_sharing_recipient_idx` ON `ni_sharing_grants` (`recipientUserId`,`status`);