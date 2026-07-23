CREATE TABLE `mep_leader_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`docType` enum('work_goals','idp','prior_assessment','other') NOT NULL DEFAULT 'other',
	`fileName` varchar(500) NOT NULL,
	`fileUrl` varchar(2000) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileSizeBytes` int,
	`mimeType` varchar(100),
	`notes` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mep_leader_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `org_context` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`websiteUrl` varchar(500),
	`companyName` varchar(255),
	`mission` text,
	`vision` text,
	`northStar` text,
	`strategicGoals` json,
	`values` json,
	`rawScrapedText` text,
	`scrapedAt` timestamp,
	`lastUpdatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_context_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_context_tenantId_unique` UNIQUE(`tenantId`)
);
--> statement-breakpoint
ALTER TABLE `mep_leader_documents` ADD CONSTRAINT `mep_leader_documents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mep_leader_documents` ADD CONSTRAINT `mep_leader_documents_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_context` ADD CONSTRAINT `org_context_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_context` ADD CONSTRAINT `org_context_lastUpdatedBy_users_id_fk` FOREIGN KEY (`lastUpdatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;