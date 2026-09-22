CREATE TABLE `war_room_audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`priorState` json,
	`newState` json,
	`reason` text,
	`source` enum('human','ai_draft','system_rule') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `war_room_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `war_room_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`objective` text NOT NULL,
	`victoryCondition` text NOT NULL,
	`hypothesis` text,
	`ownerUserId` int NOT NULL,
	`deadline` timestamp NOT NULL,
	`reviewDate` timestamp NOT NULL,
	`indicators` json NOT NULL,
	`parkedWork` text,
	`status` enum('draft','active','paused','completed','killed','archived') NOT NULL DEFAULT 'draft',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `war_room_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `war_room_constraints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`campaignId` int NOT NULL,
	`statement` text,
	`state` enum('selected','tied','unclear','closed') NOT NULL,
	`whyItMatters` text,
	`disproofCondition` text,
	`evidenceIds` json NOT NULL,
	`ownerUserId` int,
	`reviewDate` timestamp NOT NULL,
	`createdByUserId` int NOT NULL,
	`status` enum('active','superseded','closed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `war_room_constraints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `war_room_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`campaignId` int NOT NULL,
	`constraintId` int,
	`question` text NOT NULL,
	`options` json NOT NULL,
	`recommendation` text,
	`evidenceIds` json NOT NULL,
	`chosenOption` text,
	`outcome` enum('proposed','accepted','deferred','rejected','superseded') NOT NULL DEFAULT 'proposed',
	`rationale` text,
	`costOfWaiting` text,
	`reversibility` enum('easy','moderate','hard','unknown'),
	`ownerUserId` int NOT NULL,
	`dueDate` timestamp,
	`approvedByUserId` int,
	`approvedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `war_room_decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `war_room_evidence_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`campaignId` int NOT NULL,
	`evidenceItemId` int NOT NULL,
	`relation` enum('supports','contradicts','does_not_answer') NOT NULL,
	`interpretation` text NOT NULL,
	`decisionImplication` text,
	`materiality` enum('material','context','unknown') NOT NULL DEFAULT 'unknown',
	`origin` enum('human','ai_draft') NOT NULL DEFAULT 'human',
	`reviewStatus` enum('unreviewed','accepted','rejected','superseded') NOT NULL DEFAULT 'unreviewed',
	`createdByUserId` int NOT NULL,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `war_room_evidence_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `war_room_evidence_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`campaignId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`sourceType` enum('manual_note','customer_note','delivery_note','platform_note','imported_excerpt') NOT NULL,
	`sourceLabel` varchar(255) NOT NULL,
	`sourceRef` varchar(500),
	`observedAt` timestamp NOT NULL,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	`context` text,
	`observation` text NOT NULL,
	`approvedExcerpt` text,
	`contentHash` varchar(128),
	`freshnessStatus` enum('current','stale','unknown','delayed') NOT NULL DEFAULT 'current',
	`accessScope` enum('tenant') NOT NULL DEFAULT 'tenant',
	`supersedesEvidenceId` int,
	`status` enum('active','superseded','retracted') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `war_room_evidence_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `war_room_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`campaignId` int NOT NULL,
	`decisionId` int,
	`statement` text NOT NULL,
	`ownerUserId` int NOT NULL,
	`deadline` timestamp,
	`reviewDate` timestamp,
	`expectedEvidence` text NOT NULL,
	`escalationCondition` text,
	`killCondition` text,
	`status` enum('draft','approved','in_progress','completed','paused','killed') NOT NULL DEFAULT 'draft',
	`approvedByUserId` int,
	`approvedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `war_room_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `war_room_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`campaignId` int NOT NULL,
	`reviewDate` timestamp NOT NULL,
	`expectedBelief` text NOT NULL,
	`actionsTaken` text NOT NULL,
	`actualEvidence` text NOT NULL,
	`hypothesisStatus` enum('strengthened','weakened','unanswered','invalidated') NOT NULL,
	`constraintState` enum('selected','tied','unclear','closed') NOT NULL,
	`decisionOutcome` enum('continue','modify','pause','kill','none') NOT NULL,
	`nextTest` text,
	`parkStopChoice` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `war_room_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `war_room_audit_events` ADD CONSTRAINT `war_room_audit_events_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_audit_events` ADD CONSTRAINT `war_room_audit_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_campaigns` ADD CONSTRAINT `war_room_campaigns_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_campaigns` ADD CONSTRAINT `war_room_campaigns_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_campaigns` ADD CONSTRAINT `war_room_campaigns_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_constraints` ADD CONSTRAINT `war_room_constraints_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_constraints` ADD CONSTRAINT `war_room_constraints_campaignId_war_room_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `war_room_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_constraints` ADD CONSTRAINT `war_room_constraints_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_constraints` ADD CONSTRAINT `war_room_constraints_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_decisions` ADD CONSTRAINT `war_room_decisions_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_decisions` ADD CONSTRAINT `war_room_decisions_campaignId_war_room_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `war_room_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_decisions` ADD CONSTRAINT `war_room_decisions_constraintId_war_room_constraints_id_fk` FOREIGN KEY (`constraintId`) REFERENCES `war_room_constraints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_decisions` ADD CONSTRAINT `war_room_decisions_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_decisions` ADD CONSTRAINT `war_room_decisions_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_decisions` ADD CONSTRAINT `war_room_decisions_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_evidence_assessments` ADD CONSTRAINT `war_room_evidence_assessments_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_evidence_assessments` ADD CONSTRAINT `war_room_evidence_assessments_campaignId_war_room_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `war_room_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_evidence_assessments` ADD CONSTRAINT `war_room_evidence_assessments_evidenceItemId_war_room_evidence_items_id_fk` FOREIGN KEY (`evidenceItemId`) REFERENCES `war_room_evidence_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_evidence_assessments` ADD CONSTRAINT `war_room_evidence_assessments_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_evidence_assessments` ADD CONSTRAINT `war_room_evidence_assessments_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_evidence_items` ADD CONSTRAINT `war_room_evidence_items_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_evidence_items` ADD CONSTRAINT `war_room_evidence_items_campaignId_war_room_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `war_room_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_evidence_items` ADD CONSTRAINT `war_room_evidence_items_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_evidence_items` ADD CONSTRAINT `war_room_evidence_supersedes_fk` FOREIGN KEY (`supersedesEvidenceId`) REFERENCES `war_room_evidence_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_orders` ADD CONSTRAINT `war_room_orders_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_orders` ADD CONSTRAINT `war_room_orders_campaignId_war_room_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `war_room_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_orders` ADD CONSTRAINT `war_room_orders_decisionId_war_room_decisions_id_fk` FOREIGN KEY (`decisionId`) REFERENCES `war_room_decisions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_orders` ADD CONSTRAINT `war_room_orders_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_orders` ADD CONSTRAINT `war_room_orders_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_orders` ADD CONSTRAINT `war_room_orders_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_reviews` ADD CONSTRAINT `war_room_reviews_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_reviews` ADD CONSTRAINT `war_room_reviews_campaignId_war_room_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `war_room_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `war_room_reviews` ADD CONSTRAINT `war_room_reviews_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `war_room_audit_tenant_created_idx` ON `war_room_audit_events` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `war_room_audit_entity_idx` ON `war_room_audit_events` (`entityType`,`entityId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `war_room_campaigns_tenant_status_idx` ON `war_room_campaigns` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `war_room_campaigns_owner_idx` ON `war_room_campaigns` (`ownerUserId`,`status`);--> statement-breakpoint
CREATE INDEX `war_room_constraints_tenant_campaign_idx` ON `war_room_constraints` (`tenantId`,`campaignId`,`status`);--> statement-breakpoint
CREATE INDEX `war_room_constraints_review_idx` ON `war_room_constraints` (`reviewDate`,`status`);--> statement-breakpoint
CREATE INDEX `war_room_decisions_tenant_campaign_idx` ON `war_room_decisions` (`tenantId`,`campaignId`,`outcome`);--> statement-breakpoint
CREATE INDEX `war_room_decisions_due_idx` ON `war_room_decisions` (`dueDate`,`outcome`);--> statement-breakpoint
CREATE INDEX `war_room_assessments_tenant_campaign_idx` ON `war_room_evidence_assessments` (`tenantId`,`campaignId`,`reviewStatus`);--> statement-breakpoint
CREATE INDEX `war_room_assessments_evidence_idx` ON `war_room_evidence_assessments` (`evidenceItemId`,`reviewStatus`);--> statement-breakpoint
CREATE INDEX `war_room_evidence_tenant_campaign_idx` ON `war_room_evidence_items` (`tenantId`,`campaignId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `war_room_evidence_campaign_status_idx` ON `war_room_evidence_items` (`campaignId`,`status`,`observedAt`);--> statement-breakpoint
CREATE INDEX `war_room_orders_tenant_campaign_idx` ON `war_room_orders` (`tenantId`,`campaignId`,`status`);--> statement-breakpoint
CREATE INDEX `war_room_orders_review_idx` ON `war_room_orders` (`reviewDate`,`status`);--> statement-breakpoint
CREATE INDEX `war_room_reviews_tenant_campaign_idx` ON `war_room_reviews` (`tenantId`,`campaignId`,`reviewDate`);