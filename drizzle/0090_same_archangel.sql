CREATE TABLE `academy_assessment_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`assessmentType` varchar(50) NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`dimensionScores` json NOT NULL,
	`confidenceSignals` json NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_assessment_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_assessment_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`itemKey` varchar(120) NOT NULL,
	`response` varchar(255) NOT NULL,
	`confidence` varchar(20) NOT NULL DEFAULT 'medium',
	`isCorrect` boolean NOT NULL DEFAULT false,
	`dimension` varchar(40) NOT NULL,
	`gapCode` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academy_assessment_responses_id` PRIMARY KEY(`id`),
	CONSTRAINT `academy_response_attempt_item_unique` UNIQUE(`attemptId`,`itemKey`)
);
--> statement-breakpoint
CREATE TABLE `academy_knowledge_objects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`objectType` varchar(80) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`content` json NOT NULL,
	`disclosureBand` varchar(40) NOT NULL DEFAULT 'need_now',
	`approvalStatus` varchar(40) NOT NULL DEFAULT 'approved',
	`version` int NOT NULL DEFAULT 1,
	`ownerId` int,
	`productCode` varchar(100),
	`roleRelevance` json NOT NULL,
	`replacementId` int,
	`obsoleteAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_knowledge_objects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_mentor_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`role` varchar(20) NOT NULL,
	`content` text NOT NULL,
	`citations` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academy_mentor_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_mentor_threads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`mode` varchar(40) NOT NULL DEFAULT 'ask',
	`contextSnapshot` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_mentor_threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`roleTrack` varchar(80) NOT NULL DEFAULT 'other',
	`stage` varchar(80) NOT NULL DEFAULT 'orientation',
	`fluencyLevel` varchar(80) NOT NULL DEFAULT 'product_aware',
	`dimensionScores` json NOT NULL,
	`gaps` json NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academy_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_progress_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`objectKey` varchar(160),
	`dimension` varchar(40),
	`evidenceRef` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academy_progress_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `academy_assessment_attempts` ADD CONSTRAINT `acad_att_profile_fk` FOREIGN KEY (`profileId`) REFERENCES `academy_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_assessment_responses` ADD CONSTRAINT `acad_resp_attempt_fk` FOREIGN KEY (`attemptId`) REFERENCES `academy_assessment_attempts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_knowledge_objects` ADD CONSTRAINT `acad_know_tenant_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_knowledge_objects` ADD CONSTRAINT `acad_know_owner_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_mentor_messages` ADD CONSTRAINT `acad_msg_thread_fk` FOREIGN KEY (`threadId`) REFERENCES `academy_mentor_threads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_mentor_threads` ADD CONSTRAINT `acad_thread_profile_fk` FOREIGN KEY (`profileId`) REFERENCES `academy_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_profiles` ADD CONSTRAINT `acad_prof_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_profiles` ADD CONSTRAINT `acad_prof_tenant_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_progress_events` ADD CONSTRAINT `acad_evt_profile_fk` FOREIGN KEY (`profileId`) REFERENCES `academy_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `academy_attempts_profile_idx` ON `academy_assessment_attempts` (`profileId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `academy_responses_attempt_idx` ON `academy_assessment_responses` (`attemptId`);--> statement-breakpoint
CREATE INDEX `academy_knowledge_slug_idx` ON `academy_knowledge_objects` (`slug`);--> statement-breakpoint
CREATE INDEX `academy_knowledge_type_status_idx` ON `academy_knowledge_objects` (`objectType`,`approvalStatus`);--> statement-breakpoint
CREATE INDEX `academy_knowledge_product_idx` ON `academy_knowledge_objects` (`productCode`);--> statement-breakpoint
CREATE INDEX `academy_messages_thread_idx` ON `academy_mentor_messages` (`threadId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `academy_threads_profile_idx` ON `academy_mentor_threads` (`profileId`,`lastActiveAt`);--> statement-breakpoint
CREATE INDEX `academy_profiles_user_idx` ON `academy_profiles` (`userId`);--> statement-breakpoint
CREATE INDEX `academy_profiles_tenant_idx` ON `academy_profiles` (`tenantId`);--> statement-breakpoint
CREATE INDEX `academy_events_profile_idx` ON `academy_progress_events` (`profileId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `academy_events_type_idx` ON `academy_progress_events` (`eventType`);