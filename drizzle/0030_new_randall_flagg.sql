CREATE TABLE `career_access_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentRole` varchar(255),
	`targetRole` varchar(255),
	`targetIndustries` json,
	`targetCompanySize` varchar(100),
	`targetLocation` varchar(255),
	`resumeUrl` text,
	`linkedInUrl` text,
	`openToRelocation` boolean DEFAULT false,
	`timelineMonths` int,
	`salaryExpectation` varchar(100),
	`keyStrengths` json,
	`notableAchievements` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `career_access_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `career_strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`strategyStatement` text,
	`valueProposition` text,
	`careerNarrative` text,
	`positioningCanvas` json,
	`decisionCriteria` json,
	`generatedAt` timestamp,
	`version` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `career_strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunity_pipeline` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`company` varchar(255) NOT NULL,
	`role` varchar(255),
	`industry` varchar(100),
	`stage` enum('radar','targeting','engaging','interviewing','offer','closed_won','closed_lost') NOT NULL DEFAULT 'radar',
	`probability` int DEFAULT 0,
	`keyContact` varchar(255),
	`relationshipStrength` enum('none','weak','moderate','strong') DEFAULT 'none',
	`accessPath` varchar(255),
	`nextAction` text,
	`nextActionDate` timestamp,
	`lastActivityDate` timestamp,
	`notes` text,
	`whyThisCompany` text,
	`aiSuggested` boolean DEFAULT false,
	`dismissed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opportunity_pipeline_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunity_radar_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`opportunityId` int,
	`signalType` enum('hiring','expansion','leadership_change','funding','product_launch','partnership','award') NOT NULL,
	`company` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`recommendedAction` text,
	`urgency` enum('low','medium','high') DEFAULT 'medium',
	`dismissed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opportunity_radar_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `career_access_profiles` ADD CONSTRAINT `career_access_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `career_strategies` ADD CONSTRAINT `career_strategies_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opportunity_pipeline` ADD CONSTRAINT `opportunity_pipeline_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opportunity_radar_signals` ADD CONSTRAINT `opportunity_radar_signals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opportunity_radar_signals` ADD CONSTRAINT `opportunity_radar_signals_opportunityId_opportunity_pipeline_id_fk` FOREIGN KEY (`opportunityId`) REFERENCES `opportunity_pipeline`(`id`) ON DELETE no action ON UPDATE no action;