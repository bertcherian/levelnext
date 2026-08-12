CREATE TABLE `launch_challenge_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`status` enum('active','completed') NOT NULL DEFAULT 'active',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `launch_challenge_enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `launch_challenge_enrollment_unique` UNIQUE(`challengeId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `launch_weekly_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekKey` varchar(10) NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`goalType` enum('daily_missions') NOT NULL DEFAULT 'daily_missions',
	`goalTarget` int NOT NULL DEFAULT 5,
	`xpBonus` int NOT NULL DEFAULT 100,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `launch_weekly_challenges_id` PRIMARY KEY(`id`),
	CONSTRAINT `launch_weekly_challenges_weekKey_unique` UNIQUE(`weekKey`)
);
--> statement-breakpoint
ALTER TABLE `launch_challenge_enrollments` ADD CONSTRAINT `launch_challenge_enrollments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `launch_challenge_enrollments` ADD CONSTRAINT `launch_challenge_enrollments_challenge_fk` FOREIGN KEY (`challengeId`) REFERENCES `launch_weekly_challenges`(`id`) ON DELETE no action ON UPDATE no action;
