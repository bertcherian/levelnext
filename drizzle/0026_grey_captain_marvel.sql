CREATE TABLE `brand_strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`linkedinHeadline` text,
	`linkedinSummary` text,
	`linkedinAboutSection` text,
	`brandStatement` text,
	`uniqueValueProposition` text,
	`targetAudience` text,
	`thoughtLeadershipPillars` json DEFAULT ('[]'),
	`contentCalendar` json DEFAULT ('[]'),
	`visibilityPlan` json,
	`careerNarrative` text,
	`elevatorPitch` text,
	`executiveBio` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outreach_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactId` int,
	`contactName` varchar(200) NOT NULL,
	`contactTitle` varchar(200),
	`contactCompany` varchar(200),
	`outreachGoal` varchar(100),
	`linkedinMessage` text,
	`emailSubject` text,
	`emailBody` text,
	`warmIntroRequest` text,
	`followUpMessage` text,
	`meetingAgenda` json DEFAULT ('[]'),
	`talkingPoints` json DEFAULT ('[]'),
	`questionsToAsk` json DEFAULT ('[]'),
	`thingsToAvoid` json DEFAULT ('[]'),
	`desiredOutcome` text,
	`followUpPlan` text,
	`status` varchar(30) NOT NULL DEFAULT 'draft',
	`sentAt` timestamp,
	`responseReceived` boolean DEFAULT false,
	`userNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `outreach_drafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `brand_strategies` ADD CONSTRAINT `brand_strategies_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outreach_drafts` ADD CONSTRAINT `outreach_drafts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outreach_drafts` ADD CONSTRAINT `outreach_drafts_contactId_relationship_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `relationship_contacts`(`id`) ON DELETE no action ON UPDATE no action;