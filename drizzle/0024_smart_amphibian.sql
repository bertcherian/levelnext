CREATE TABLE `career_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetRole` varchar(200),
	`targetRoleType` varchar(100),
	`problemsToSolve` text,
	`legacyStatement` text,
	`targetIndustries` json,
	`avoidIndustries` json,
	`targetCompanyTypes` json,
	`dreamCompanies` json,
	`targetGeographies` json,
	`targetCompensationMin` int,
	`targetCompensationMax` int,
	`compensationCurrency` varchar(10) DEFAULT 'INR',
	`preferredWorkStyle` varchar(50),
	`lifestyleStatement` text,
	`familyConstraints` text,
	`coreValues` json,
	`careerMotivation` text,
	`riskAppetite` varchar(20),
	`linkedinUrl` varchar(500),
	`resumeUrl` varchar(500),
	`careerHistory` text,
	`keyAchievements` text,
	`awardsAndRecognition` text,
	`speakingHistory` text,
	`publications` text,
	`industryExpertise` json,
	`completionPct` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `career_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `career_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `career_strategy_statements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`strategyData` json,
	`profileVersion` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `career_strategy_statements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunity_universe` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`companyType` varchar(50) NOT NULL,
	`industry` varchar(100),
	`geography` varchar(100),
	`description` text,
	`scoreFit` int,
	`scoreGrowth` int,
	`scoreLearning` int,
	`scoreInfluence` int,
	`scoreCompensation` int,
	`scoreLeadershipCulture` int,
	`scoreInnovation` int,
	`scoreStability` int,
	`scoreCareerAcceleration` int,
	`scorePurposeAlignment` int,
	`compositeScore` int,
	`whyThisCompany` text,
	`potentialRole` varchar(200),
	`hiddenOpportunitySignal` text,
	`status` varchar(30) NOT NULL DEFAULT 'identified',
	`userNotes` text,
	`batchId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opportunity_universe_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `career_profiles` ADD CONSTRAINT `career_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `career_strategy_statements` ADD CONSTRAINT `career_strategy_statements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opportunity_universe` ADD CONSTRAINT `opportunity_universe_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;