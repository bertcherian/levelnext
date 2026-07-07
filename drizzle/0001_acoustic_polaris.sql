CREATE TABLE `assessment_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`tenantId` int,
	`moduleType` enum('ECI','LII','GCC') NOT NULL,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`responses` json,
	`currentQuestionIndex` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessment_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moduleType` enum('ECI','LII','GCC','GENERAL') NOT NULL DEFAULT 'GENERAL',
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`status` enum('pending','in_progress','complete') NOT NULL DEFAULT 'pending',
	`dueDate` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guide_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`messages` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guide_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int,
	`userId` int,
	`tenantId` int,
	`slug` varchar(100),
	`moduleType` enum('ECI','LII','GCC') NOT NULL,
	`participantName` varchar(255) NOT NULL,
	`participantEmail` varchar(320) NOT NULL,
	`participantRole` varchar(255),
	`organisation` varchar(255),
	`edgeScore` float NOT NULL,
	`zone` varchar(100),
	`archetype` varchar(100),
	`dimensionScores` json,
	`responses` json,
	`llmAnalysis` json,
	`pdfUrl` text,
	`pdfKey` text,
	`emailSent` boolean NOT NULL DEFAULT false,
	`isDemo` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `reports_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `tenant_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenant_users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`industry` varchar(100),
	`size` varchar(50),
	`hq` varchar(100),
	`contactEmail` varchar(320),
	`inviteCode` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `tenants_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `leadershipGraph` json;--> statement-breakpoint
ALTER TABLE `assessment_sessions` ADD CONSTRAINT `assessment_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessment_sessions` ADD CONSTRAINT `assessment_sessions_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `daily_missions` ADD CONSTRAINT `daily_missions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guide_conversations` ADD CONSTRAINT `guide_conversations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_sessionId_assessment_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `assessment_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_users` ADD CONSTRAINT `tenant_users_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_users` ADD CONSTRAINT `tenant_users_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;