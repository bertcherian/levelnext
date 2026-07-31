CREATE TABLE `launch_application_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`applicationId` int NOT NULL,
	`reminderType` enum('interview','follow_up','deadline','assessment','other') NOT NULL DEFAULT 'other',
	`reminderDate` timestamp NOT NULL,
	`note` varchar(500),
	`isDone` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `launch_application_reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `launch_xp_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`xpAmount` int NOT NULL,
	`source` varchar(100) NOT NULL,
	`recordedDate` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `launch_xp_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `launch_application_reminders` ADD CONSTRAINT `launch_application_reminders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `launch_application_reminders` ADD CONSTRAINT `launch_application_reminders_applicationId_launch_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `launch_applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `launch_xp_history` ADD CONSTRAINT `launch_xp_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;