CREATE TABLE `org_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`fileUrl` varchar(1000),
	`fileKey` varchar(500),
	`fileName` varchar(255),
	`fileSize` int,
	`mimeType` varchar(100),
	`confidentiality` enum('general','internal','confidential','restricted','executive') DEFAULT 'internal',
	`processingStatus` enum('uploaded','processing','extracted','needs_review','approved','rejected') DEFAULT 'uploaded',
	`useInAICoaching` boolean DEFAULT true,
	`useInDiagnostics` boolean DEFAULT true,
	`useInReports` boolean DEFAULT true,
	`useInSimulations` boolean DEFAULT false,
	`extractedContent` json,
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `org_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`invitedBy` int,
	`status` enum('pending','accepted','expired') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `org_invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organisations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`legalName` varchar(255) NOT NULL,
	`displayName` varchar(255),
	`website` varchar(500),
	`logoUrl` varchar(1000),
	`industry` varchar(100),
	`subIndustry` varchar(100),
	`companySize` varchar(50),
	`employeeCount` varchar(50),
	`hq` varchar(100),
	`countries` json,
	`primaryLanguage` varchar(50),
	`description` text,
	`isGcc` boolean DEFAULT false,
	`missionStatement` text,
	`visionStatement` text,
	`purposeStatement` text,
	`missionSourceType` varchar(30),
	`values` json,
	`competencies` json,
	`strategicPriorities` json,
	`branding` json,
	`applicationSettings` json,
	`setupRoute` enum('upload','build','standard'),
	`wizardStep` int DEFAULT 1,
	`wizardStatus` enum('in_progress','completed','activated') DEFAULT 'in_progress',
	`contextActivated` boolean DEFAULT false,
	`activatedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organisations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organisations_tenantId_unique` UNIQUE(`tenantId`)
);
--> statement-breakpoint
ALTER TABLE `org_documents` ADD CONSTRAINT `org_documents_organisationId_organisations_id_fk` FOREIGN KEY (`organisationId`) REFERENCES `organisations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_documents` ADD CONSTRAINT `org_documents_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_invitations` ADD CONSTRAINT `org_invitations_organisationId_organisations_id_fk` FOREIGN KEY (`organisationId`) REFERENCES `organisations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_invitations` ADD CONSTRAINT `org_invitations_invitedBy_users_id_fk` FOREIGN KEY (`invitedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organisations` ADD CONSTRAINT `organisations_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organisations` ADD CONSTRAINT `organisations_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;