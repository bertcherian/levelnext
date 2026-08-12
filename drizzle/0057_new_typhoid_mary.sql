CREATE TABLE `early_career_coach_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `early_career_coach_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `early_career_coach_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`title` varchar(160) NOT NULL,
	`startingContext` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `early_career_coach_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `early_career_diagnostic_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`overallScore` float NOT NULL,
	`capabilityScores` json NOT NULL,
	`developmentalBand` varchar(100) NOT NULL,
	`recommendedCapabilityId` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `early_career_diagnostic_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `early_career_diagnostic_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`responses` json NOT NULL,
	`currentQuestionIndex` int NOT NULL DEFAULT 0,
	`status` enum('in_progress','completed') NOT NULL DEFAULT 'in_progress',
	`consentedAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `early_career_diagnostic_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `early_career_nudge_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`audience` enum('employees','managers') NOT NULL,
	`cadence` enum('weekly','fortnightly','monthly') NOT NULL DEFAULT 'weekly',
	`journeyStage` varchar(40) NOT NULL DEFAULT 'all',
	`dayOfWeek` int NOT NULL DEFAULT 1,
	`hourUtc` int NOT NULL DEFAULT 8,
	`scheduleCronTaskUid` varchar(65),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `early_career_nudge_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `early_career_nudge_tenant_audience_unique` UNIQUE(`tenantId`,`audience`)
);
--> statement-breakpoint
CREATE TABLE `early_career_nudge_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configId` int NOT NULL,
	`recipientUserId` int NOT NULL,
	`employeeUserId` int,
	`tenantId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`status` enum('created','read','dismissed') NOT NULL DEFAULT 'created',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `early_career_nudge_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `early_career_practice_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`scenarioId` varchar(100) NOT NULL,
	`scenarioTitle` varchar(255) NOT NULL,
	`difficulty` enum('guided','realistic','stretch') NOT NULL DEFAULT 'realistic',
	`messages` json NOT NULL,
	`status` enum('active','completed') NOT NULL DEFAULT 'active',
	`feedback` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `early_career_practice_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `early_career_coach_messages` ADD CONSTRAINT `ec_cm_session_fk` FOREIGN KEY (`sessionId`) REFERENCES `early_career_coach_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_coach_sessions` ADD CONSTRAINT `ec_cs_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_coach_sessions` ADD CONSTRAINT `ec_cs_tenant_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_diagnostic_results` ADD CONSTRAINT `ec_dr_session_fk` FOREIGN KEY (`sessionId`) REFERENCES `early_career_diagnostic_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_diagnostic_results` ADD CONSTRAINT `ec_dr_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_diagnostic_results` ADD CONSTRAINT `ec_dr_tenant_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_diagnostic_sessions` ADD CONSTRAINT `ec_ds_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_diagnostic_sessions` ADD CONSTRAINT `ec_ds_tenant_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_nudge_configs` ADD CONSTRAINT `ec_nc_tenant_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_nudge_configs` ADD CONSTRAINT `ec_nc_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_nudge_deliveries` ADD CONSTRAINT `ec_nd_config_fk` FOREIGN KEY (`configId`) REFERENCES `early_career_nudge_configs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_nudge_deliveries` ADD CONSTRAINT `ec_nd_recipient_fk` FOREIGN KEY (`recipientUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_nudge_deliveries` ADD CONSTRAINT `ec_nd_employee_fk` FOREIGN KEY (`employeeUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_nudge_deliveries` ADD CONSTRAINT `ec_nd_tenant_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_practice_sessions` ADD CONSTRAINT `ec_ps_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_practice_sessions` ADD CONSTRAINT `ec_ps_tenant_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;
