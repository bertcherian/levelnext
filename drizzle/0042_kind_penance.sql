CREATE TABLE `user_resumes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`originalFileName` varchar(255),
	`originalFileUrl` varchar(1000),
	`originalFileKey` varchar(500),
	`extractedText` text,
	`atsScore` int,
	`atsBreakdown` json,
	`careerQualityScore` int,
	`qualityBreakdown` json,
	`targetJobDescription` text,
	`rewrittenText` text,
	`rewrittenHtml` text,
	`rewrittenFileUrl` varchar(1000),
	`rewrittenFileKey` varchar(500),
	`rewrittenAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_resumes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_resumes` ADD CONSTRAINT `user_resumes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;