CREATE TABLE `launch_user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accentColor` varchar(20) NOT NULL DEFAULT 'cyan',
	`avatar` varchar(255) NOT NULL DEFAULT '🚀',
	`notifyDailyMissions` boolean NOT NULL DEFAULT true,
	`notifyStreaks` boolean NOT NULL DEFAULT true,
	`notifyAchievements` boolean NOT NULL DEFAULT true,
	`notifyReminders` boolean NOT NULL DEFAULT true,
	`reducedMotion` boolean NOT NULL DEFAULT false,
	`highContrast` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launch_user_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `launch_user_preferences` ADD CONSTRAINT `launch_user_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;