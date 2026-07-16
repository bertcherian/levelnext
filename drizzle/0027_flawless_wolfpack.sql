CREATE TABLE `behaviour_commitments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`commitment` text NOT NULL,
	`sourceDiagnostic` varchar(20),
	`targetDate` timestamp,
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`checkIns` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `behaviour_commitments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manager_guide_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `manager_guide_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manager_guide_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manager_guide_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manager_playbook_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`situation` text NOT NULL,
	`situationType` varchar(100),
	`playbook` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `manager_playbook_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mep_daily_briefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`briefDate` varchar(10) NOT NULL,
	`brief` json,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mep_daily_briefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mep_diagnostic_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`diagnosticCode` varchar(20) NOT NULL,
	`responses` json NOT NULL,
	`dimensionScores` json NOT NULL,
	`overallScore` float NOT NULL,
	`zone` varchar(50),
	`llmAnalysis` json,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mep_diagnostic_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mep_practice_sessions` (
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
	CONSTRAINT `mep_practice_sessions_id` PRIMARY KEY(`id`)
);
