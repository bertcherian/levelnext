CREATE TABLE `pe_assessment_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` int,
	`overallScore` float NOT NULL,
	`zone` varchar(50) NOT NULL,
	`dimensionScores` json NOT NULL,
	`llmAnalysis` json,
	`developmentPlan` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pe_assessment_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pe_assessment_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`responses` json,
	`currentQuestionIndex` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pe_assessment_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pe_calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationId` int NOT NULL,
	`externalEventId` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`attendees` json,
	`meetingLink` varchar(1000),
	`isHighStakes` boolean NOT NULL DEFAULT false,
	`prepSuggestionSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pe_calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pe_calendar_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(20) NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`expiresAt` timestamp,
	`lastSyncAt` timestamp,
	`syncStatus` varchar(20) NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pe_calendar_integrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pe_coach_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pe_coach_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pe_coach_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`context` text,
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pe_coach_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pe_commitments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`text` text NOT NULL,
	`dueDate` timestamp,
	`sourceType` varchar(50) NOT NULL DEFAULT 'manual',
	`sourceId` int,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`outcome` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pe_commitments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pe_daily_briefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`briefDate` varchar(10) NOT NULL,
	`brief` json NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pe_daily_briefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pe_practice_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scenario` varchar(255) NOT NULL,
	`scenarioType` varchar(100),
	`counterpartPersonality` varchar(100),
	`messages` json DEFAULT ('[]'),
	`coachingFeedback` json,
	`status` enum('active','completed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pe_practice_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pe_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentRole` varchar(255),
	`targetRole` varchar(255),
	`experienceYears` int,
	`department` varchar(255),
	`careerGoals` json,
	`developmentFocus` json,
	`voiceProvider` varchar(50) DEFAULT 'openai',
	`voiceId` varchar(50) DEFAULT 'nova',
	`voiceLanguage` varchar(10) DEFAULT 'en',
	`onboardingComplete` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pe_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `pe_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `pe_team_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`managerId` int NOT NULL,
	`tenantId` int,
	`teamAdoptionRate` float NOT NULL DEFAULT 0,
	`avgSessionDuration` float NOT NULL DEFAULT 0,
	`assessmentCompletionRate` float NOT NULL DEFAULT 0,
	`practiceEngagementRate` float NOT NULL DEFAULT 0,
	`developmentFocusAreas` json,
	`trendData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pe_team_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sim_sessions` MODIFY COLUMN `characterStyle` text;--> statement-breakpoint
ALTER TABLE `sim_sessions` ADD `voice` varchar(20) DEFAULT 'onyx';--> statement-breakpoint
ALTER TABLE `pe_assessment_results` ADD CONSTRAINT `pe_assessment_results_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pe_assessment_results` ADD CONSTRAINT `pe_assessment_results_sessionId_pe_assessment_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `pe_assessment_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pe_assessment_sessions` ADD CONSTRAINT `pe_assessment_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pe_calendar_events` ADD CONSTRAINT `pe_calendar_events_integrationId_pe_calendar_integrations_id_fk` FOREIGN KEY (`integrationId`) REFERENCES `pe_calendar_integrations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pe_calendar_integrations` ADD CONSTRAINT `pe_calendar_integrations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pe_coach_messages` ADD CONSTRAINT `pe_coach_messages_sessionId_pe_coach_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `pe_coach_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pe_coach_sessions` ADD CONSTRAINT `pe_coach_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pe_commitments` ADD CONSTRAINT `pe_commitments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pe_daily_briefs` ADD CONSTRAINT `pe_daily_briefs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pe_practice_sessions` ADD CONSTRAINT `pe_practice_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pe_profiles` ADD CONSTRAINT `pe_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pe_team_metrics` ADD CONSTRAINT `pe_team_metrics_managerId_users_id_fk` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pe_team_metrics` ADD CONSTRAINT `pe_team_metrics_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;