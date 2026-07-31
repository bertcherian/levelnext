CREATE TABLE `launch_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(10),
	`xpBonus` int NOT NULL DEFAULT 0,
	CONSTRAINT `launch_achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `launch_achievements_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `launch_community_wins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`winType` enum('first_interview','resume_complete','offer_received','streak_7','first_application','custom') NOT NULL,
	`message` text,
	`isAnonymous` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `launch_community_wins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `launch_daily_missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`missions` json NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `launch_daily_missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `launch_user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementCode` varchar(100) NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `launch_user_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `launch_user_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`currentLevel` varchar(50) NOT NULL DEFAULT 'Explorer',
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActiveDate` varchar(10),
	`employabilityScores` json,
	`compositeScore` float DEFAULT 0,
	`targetRole` varchar(255),
	`targetIndustry` varchar(255),
	`experienceLevel` varchar(50),
	`onboardingComplete` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launch_user_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `launch_xp_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`xpEarned` int NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `launch_xp_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `magic_link_tokens` ADD `returnTo` varchar(255);--> statement-breakpoint
ALTER TABLE `org_context` ADD `logoUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `org_context` ADD `leadershipFrameworks` json;--> statement-breakpoint
ALTER TABLE `launch_community_wins` ADD CONSTRAINT `launch_community_wins_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `launch_daily_missions` ADD CONSTRAINT `launch_daily_missions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `launch_user_achievements` ADD CONSTRAINT `launch_user_achievements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `launch_user_progress` ADD CONSTRAINT `launch_user_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `launch_xp_ledger` ADD CONSTRAINT `launch_xp_ledger_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;