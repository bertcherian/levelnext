CREATE TABLE `launch_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`roleName` varchar(200) NOT NULL,
	`jobUrl` text,
	`location` varchar(150),
	`salaryRange` varchar(100),
	`appStatus` enum('wishlist','applied','phone_screen','interview','offer','rejected','withdrawn') NOT NULL DEFAULT 'wishlist',
	`appliedAt` timestamp,
	`nextActionDate` timestamp,
	`nextActionNote` varchar(500),
	`notes` text,
	`contactName` varchar(150),
	`contactRole` varchar(150),
	`contactLinkedin` text,
	`excitement` int DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launch_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `launch_skill_sprint` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moduleId` varchar(50) NOT NULL,
	`moduleTitle` varchar(150) NOT NULL,
	`category` varchar(80) NOT NULL,
	`ssStatus` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`challengeResponse` text,
	`challengeFeedback` text,
	`challengeScore` int,
	`xpEarned` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launch_skill_sprint_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `launch_applications` ADD CONSTRAINT `launch_applications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `launch_skill_sprint` ADD CONSTRAINT `launch_skill_sprint_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;