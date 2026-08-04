CREATE TABLE `ic_audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`actorUserId` int,
	`subjectUserId` int,
	`eventType` varchar(120) NOT NULL,
	`resourceType` varchar(80),
	`resourceId` int,
	`processingPurpose` varchar(120),
	`authorizationResult` enum('allowed','denied','not_applicable') NOT NULL DEFAULT 'not_applicable',
	`traceId` varchar(80),
	`metadata` json,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ic_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ic_diagnostic_instances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`tenantId` int,
	`userId` int,
	`moduleType` varchar(20) NOT NULL,
	`edgeScore` float NOT NULL,
	`dimensionScores` json,
	`archetype` varchar(100),
	`zone` varchar(100),
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ic_diagnostic_instances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ic_judgment_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`diagnosticInstanceId` int NOT NULL,
	`ruleVersionId` int NOT NULL,
	`tenantId` int,
	`userId` int,
	`inputSnapshot` json NOT NULL,
	`matched` boolean NOT NULL,
	`outputSnapshot` json,
	`inputConfidence` float,
	`ruleApplicability` float,
	`traceId` varchar(80),
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ic_judgment_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ic_judgment_rule_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` int NOT NULL,
	`version` int NOT NULL,
	`conditions` json NOT NULL,
	`recommendationTitle` varchar(255) NOT NULL,
	`recommendationDescription` text NOT NULL,
	`recommendationType` varchar(100) NOT NULL,
	`actionCheckInDays` int NOT NULL DEFAULT 7,
	`outcomeCheckInDays` int NOT NULL DEFAULT 30,
	`mutexGroup` varchar(100),
	`maxRecommendations` int NOT NULL DEFAULT 3,
	`explanationTemplate` text,
	`status` enum('draft','active','superseded') NOT NULL DEFAULT 'draft',
	`effectiveFrom` timestamp,
	`effectiveTo` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ic_judgment_rule_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ic_judgment_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleCode` varchar(120) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`description` text,
	`moduleType` varchar(20) NOT NULL,
	`dimensionId` varchar(100),
	`priority` int NOT NULL DEFAULT 50,
	`status` enum('draft','tested','reviewed','approved','active','retired') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ic_judgment_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `ic_judgment_rules_ruleCode_unique` UNIQUE(`ruleCode`)
);
--> statement-breakpoint
CREATE TABLE `ic_outbox_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`eventType` varchar(120) NOT NULL,
	`aggregateType` varchar(80),
	`aggregateId` int,
	`payload` json,
	`status` enum('pending','processing','published','failed','dead_letter') NOT NULL DEFAULT 'pending',
	`attemptCount` int NOT NULL DEFAULT 0,
	`availableAt` timestamp NOT NULL DEFAULT (now()),
	`publishedAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ic_outbox_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ic_outcome_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`outcomeObservationId` int NOT NULL,
	`evidenceSource` enum('self_report','manager_confirmation','coach_observation','system_metric','uploaded_document','hr_validation') NOT NULL,
	`verificationStatus` enum('unverified','pending','verified','disputed','rejected') NOT NULL DEFAULT 'unverified',
	`evidenceReference` varchar(500),
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`verificationNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ic_outcome_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ic_outcome_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`outcomeObservationId` int NOT NULL,
	`metricCode` varchar(120) NOT NULL,
	`baselineValue` float,
	`resultValue` float,
	`unitCode` varchar(40),
	`baselineDate` timestamp,
	`resultDate` timestamp,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ic_outcome_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ic_outcome_observations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionId` int NOT NULL,
	`recommendationId` int NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`observationRound` int NOT NULL DEFAULT 1,
	`impactLevel` enum('none','minimal','moderate','significant','transformative') NOT NULL,
	`recommendationValue` enum('not_helpful','slightly_helpful','helpful','very_helpful','essential') NOT NULL,
	`causalConfidence` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`outcomeSummary` text,
	`measurementMethodCode` varchar(100),
	`observedAt` timestamp NOT NULL DEFAULT (now()),
	`idempotencyKey` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ic_outcome_observations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ic_permission_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`permissionId` int,
	`tenantId` int NOT NULL,
	`scopeType` varchar(40) NOT NULL,
	`scopeSubjectId` int NOT NULL,
	`purposeCode` varchar(120) NOT NULL,
	`eventType` enum('requested','granted','revoked','expired','deletion_requested','processing_excluded') NOT NULL,
	`policyVersion` varchar(40),
	`reason` text,
	`actorUserId` int,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`requestIpHash` varchar(100),
	`userAgentClass` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ic_permission_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ic_processing_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`scopeType` enum('organization','individual') NOT NULL,
	`scopeSubjectId` int NOT NULL,
	`purposeCode` varchar(120) NOT NULL,
	`status` enum('pending','granted','revoked','expired') NOT NULL DEFAULT 'pending',
	`policyVersion` varchar(40),
	`legalBasisCode` varchar(80),
	`effectiveFrom` timestamp,
	`effectiveTo` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ic_processing_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ic_recommendation_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recommendationId` int NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`actionTypeCode` varchar(100) NOT NULL,
	`actionDescription` text NOT NULL,
	`status` enum('planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
	`plannedStartAt` timestamp,
	`plannedCompleteAt` timestamp,
	`completedAt` timestamp,
	`completionNotes` text,
	`version` int NOT NULL DEFAULT 1,
	`idempotencyKey` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ic_recommendation_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ic_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`diagnosticInstanceId` int NOT NULL,
	`judgmentExecutionId` int NOT NULL,
	`ruleId` int NOT NULL,
	`ruleVersionId` int NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`recommendationType` varchar(100) NOT NULL,
	`priority` int NOT NULL DEFAULT 50,
	`explanation` text,
	`status` enum('generated','presented','accepted','rejected','deferred','superseded') NOT NULL DEFAULT 'generated',
	`presentedAt` timestamp,
	`decidedAt` timestamp,
	`decisionReasonCode` varchar(100),
	`decisionReasonText` text,
	`idempotencyKey` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ic_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ic_audit_events` ADD CONSTRAINT `ic_audit_events_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_audit_events` ADD CONSTRAINT `ic_audit_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_audit_events` ADD CONSTRAINT `ic_audit_events_subjectUserId_users_id_fk` FOREIGN KEY (`subjectUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_diagnostic_instances` ADD CONSTRAINT `ic_diagnostic_instances_reportId_reports_id_fk` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_diagnostic_instances` ADD CONSTRAINT `ic_diagnostic_instances_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_diagnostic_instances` ADD CONSTRAINT `ic_diagnostic_instances_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_judgment_executions` ADD CONSTRAINT `ic_judgment_executions_diagnosticInstanceId_ic_diagnostic_instances_id_fk` FOREIGN KEY (`diagnosticInstanceId`) REFERENCES `ic_diagnostic_instances`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_judgment_executions` ADD CONSTRAINT `ic_judgment_executions_ruleVersionId_ic_judgment_rule_versions_id_fk` FOREIGN KEY (`ruleVersionId`) REFERENCES `ic_judgment_rule_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_judgment_executions` ADD CONSTRAINT `ic_judgment_executions_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_judgment_executions` ADD CONSTRAINT `ic_judgment_executions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_judgment_rule_versions` ADD CONSTRAINT `ic_judgment_rule_versions_ruleId_ic_judgment_rules_id_fk` FOREIGN KEY (`ruleId`) REFERENCES `ic_judgment_rules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_judgment_rules` ADD CONSTRAINT `ic_judgment_rules_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_outbox_events` ADD CONSTRAINT `ic_outbox_events_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_outcome_evidence` ADD CONSTRAINT `ic_outcome_evidence_outcomeObservationId_ic_outcome_observations_id_fk` FOREIGN KEY (`outcomeObservationId`) REFERENCES `ic_outcome_observations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_outcome_evidence` ADD CONSTRAINT `ic_outcome_evidence_verifiedBy_users_id_fk` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_outcome_metrics` ADD CONSTRAINT `ic_outcome_metrics_outcomeObservationId_ic_outcome_observations_id_fk` FOREIGN KEY (`outcomeObservationId`) REFERENCES `ic_outcome_observations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_outcome_observations` ADD CONSTRAINT `ic_outcome_observations_actionId_ic_recommendation_actions_id_fk` FOREIGN KEY (`actionId`) REFERENCES `ic_recommendation_actions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_outcome_observations` ADD CONSTRAINT `ic_outcome_observations_recommendationId_ic_recommendations_id_fk` FOREIGN KEY (`recommendationId`) REFERENCES `ic_recommendations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_outcome_observations` ADD CONSTRAINT `ic_outcome_observations_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_outcome_observations` ADD CONSTRAINT `ic_outcome_observations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_permission_events` ADD CONSTRAINT `ic_permission_events_permissionId_ic_processing_permissions_id_fk` FOREIGN KEY (`permissionId`) REFERENCES `ic_processing_permissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_permission_events` ADD CONSTRAINT `ic_permission_events_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_permission_events` ADD CONSTRAINT `ic_permission_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_processing_permissions` ADD CONSTRAINT `ic_processing_permissions_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_recommendation_actions` ADD CONSTRAINT `ic_recommendation_actions_recommendationId_ic_recommendations_id_fk` FOREIGN KEY (`recommendationId`) REFERENCES `ic_recommendations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_recommendation_actions` ADD CONSTRAINT `ic_recommendation_actions_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_recommendation_actions` ADD CONSTRAINT `ic_recommendation_actions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_recommendations` ADD CONSTRAINT `ic_recommendations_diagnosticInstanceId_ic_diagnostic_instances_id_fk` FOREIGN KEY (`diagnosticInstanceId`) REFERENCES `ic_diagnostic_instances`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_recommendations` ADD CONSTRAINT `ic_recommendations_judgmentExecutionId_ic_judgment_executions_id_fk` FOREIGN KEY (`judgmentExecutionId`) REFERENCES `ic_judgment_executions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_recommendations` ADD CONSTRAINT `ic_recommendations_ruleId_ic_judgment_rules_id_fk` FOREIGN KEY (`ruleId`) REFERENCES `ic_judgment_rules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_recommendations` ADD CONSTRAINT `ic_recommendations_ruleVersionId_ic_judgment_rule_versions_id_fk` FOREIGN KEY (`ruleVersionId`) REFERENCES `ic_judgment_rule_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_recommendations` ADD CONSTRAINT `ic_recommendations_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_recommendations` ADD CONSTRAINT `ic_recommendations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;