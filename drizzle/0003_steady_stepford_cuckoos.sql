CREATE TABLE `after_meeting_debriefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationContext` text NOT NULL,
	`debriefTranscript` json,
	`debriefReport` json,
	`followUpMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `after_meeting_debriefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `before_meeting_briefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`meetingWith` varchar(255) NOT NULL,
	`purpose` text NOT NULL,
	`desiredOutcome` text,
	`currentIssue` text,
	`stakes` varchar(100),
	`possibleResistance` text,
	`brief` json,
	`readinessBefore` int,
	`readinessAfter` int,
	`practiceSessionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `before_meeting_briefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_briefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`shareLevel` varchar(50) NOT NULL DEFAULT 'summary',
	`brief` json,
	`sharedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_briefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commitments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`text` text NOT NULL,
	`dueDate` timestamp,
	`sourceType` varchar(50),
	`sourceId` int,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`outcome` text,
	`aiRecommendation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commitments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_scripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scriptType` varchar(100) NOT NULL,
	`situationContext` text NOT NULL,
	`script` json,
	`savedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_scripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `growth_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plan` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `growth_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `improved_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalText` text NOT NULL,
	`context` varchar(255),
	`result` json,
	`savedVersion` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `improved_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadership_memory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`memory` json,
	`aiSummary` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leadership_memory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `privacy_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`shareWithCoach` varchar(50) NOT NULL DEFAULT 'nothing',
	`shareWithOrg` boolean NOT NULL DEFAULT false,
	`allowAggregateAnalytics` boolean NOT NULL DEFAULT true,
	`coachEmail` varchar(255),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `privacy_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `readiness_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`context` varchar(255) NOT NULL,
	`scoreBefore` int NOT NULL,
	`scoreAfter` int,
	`sourceType` varchar(50),
	`sourceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `readiness_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `after_meeting_debriefs` ADD CONSTRAINT `after_meeting_debriefs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `before_meeting_briefs` ADD CONSTRAINT `before_meeting_briefs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_briefs` ADD CONSTRAINT `coach_briefs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commitments` ADD CONSTRAINT `commitments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_scripts` ADD CONSTRAINT `conversation_scripts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `growth_plans` ADD CONSTRAINT `growth_plans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `improved_messages` ADD CONSTRAINT `improved_messages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leadership_memory` ADD CONSTRAINT `leadership_memory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `privacy_settings` ADD CONSTRAINT `privacy_settings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `readiness_scores` ADD CONSTRAINT `readiness_scores_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;