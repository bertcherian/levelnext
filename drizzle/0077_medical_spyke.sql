CREATE TABLE `ctdm_admin_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`action` varchar(120) NOT NULL,
	`targetType` varchar(80) NOT NULL,
	`targetId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ctdm_admin_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ctdm_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`tenantId` int NOT NULL,
	`participantId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('in_progress','completed','withdrawn') NOT NULL DEFAULT 'in_progress',
	`currentSection` enum('profile','behaviour','scenarios','environment','reflection','complete') NOT NULL DEFAULT 'profile',
	`behaviourResponses` json,
	`scenarioResponses` json,
	`environmentResponses` json,
	`reflections` json,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ctdm_assessments_id` PRIMARY KEY(`id`),
	CONSTRAINT `ctdm_assessments_participant_unique` UNIQUE(`participantId`)
);
--> statement-breakpoint
CREATE TABLE `ctdm_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`reportingGroup` varchar(255) NOT NULL,
	`targetAudience` text,
	`targetRoles` text,
	`industryContext` varchar(150),
	`geographicContext` varchar(150),
	`intendedUse` varchar(120),
	`administrationFormat` varchar(80) NOT NULL DEFAULT 'online',
	`readingLevel` varchar(100) NOT NULL DEFAULT 'professional workplace English',
	`reportingMode` enum('individual','team','both') NOT NULL DEFAULT 'both',
	`minTeamSize` int NOT NULL DEFAULT 5,
	`namedReportAccess` boolean NOT NULL DEFAULT false,
	`consentStatement` text,
	`retentionDays` int NOT NULL DEFAULT 365,
	`status` enum('draft','active','closed','archived') NOT NULL DEFAULT 'draft',
	`startsAt` timestamp,
	`closesAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ctdm_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ctdm_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int,
	`email` varchar(320),
	`displayName` varchar(255),
	`participantRole` varchar(255),
	`status` enum('invited','in_progress','completed','withdrawn') NOT NULL DEFAULT 'invited',
	`consentAt` timestamp,
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ctdm_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `ctdm_participants_campaign_user_unique` UNIQUE(`campaignId`,`userId`),
	CONSTRAINT `ctdm_participants_campaign_email_unique` UNIQUE(`campaignId`,`email`)
);
--> statement-breakpoint
CREATE TABLE `ctdm_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`tenantId` int NOT NULL,
	`participantId` int NOT NULL,
	`assessmentId` int NOT NULL,
	`userId` int NOT NULL,
	`scoreSnapshot` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ctdm_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `ctdm_reports_assessment_unique` UNIQUE(`assessmentId`)
);
--> statement-breakpoint
ALTER TABLE `ctdm_admin_audit` ADD CONSTRAINT `ctdm_admin_audit_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_admin_audit` ADD CONSTRAINT `ctdm_admin_audit_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_assessments` ADD CONSTRAINT `ctdm_assessments_campaignId_ctdm_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `ctdm_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_assessments` ADD CONSTRAINT `ctdm_assessments_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_assessments` ADD CONSTRAINT `ctdm_assessments_participantId_ctdm_participants_id_fk` FOREIGN KEY (`participantId`) REFERENCES `ctdm_participants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_assessments` ADD CONSTRAINT `ctdm_assessments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_campaigns` ADD CONSTRAINT `ctdm_campaigns_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_campaigns` ADD CONSTRAINT `ctdm_campaigns_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_participants` ADD CONSTRAINT `ctdm_participants_campaignId_ctdm_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `ctdm_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_participants` ADD CONSTRAINT `ctdm_participants_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_participants` ADD CONSTRAINT `ctdm_participants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_reports` ADD CONSTRAINT `ctdm_reports_campaignId_ctdm_campaigns_id_fk` FOREIGN KEY (`campaignId`) REFERENCES `ctdm_campaigns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_reports` ADD CONSTRAINT `ctdm_reports_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_reports` ADD CONSTRAINT `ctdm_reports_participantId_ctdm_participants_id_fk` FOREIGN KEY (`participantId`) REFERENCES `ctdm_participants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_reports` ADD CONSTRAINT `ctdm_reports_assessmentId_ctdm_assessments_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `ctdm_assessments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ctdm_reports` ADD CONSTRAINT `ctdm_reports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ctdm_admin_audit_tenant_created_idx` ON `ctdm_admin_audit` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ctdm_assessments_tenant_status_idx` ON `ctdm_assessments` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `ctdm_assessments_user_campaign_idx` ON `ctdm_assessments` (`userId`,`campaignId`);--> statement-breakpoint
CREATE INDEX `ctdm_campaigns_tenant_status_idx` ON `ctdm_campaigns` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `ctdm_campaigns_creator_idx` ON `ctdm_campaigns` (`createdByUserId`);--> statement-breakpoint
CREATE INDEX `ctdm_participants_tenant_status_idx` ON `ctdm_participants` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `ctdm_reports_tenant_campaign_idx` ON `ctdm_reports` (`tenantId`,`campaignId`);--> statement-breakpoint
CREATE INDEX `ctdm_reports_user_idx` ON `ctdm_reports` (`userId`);