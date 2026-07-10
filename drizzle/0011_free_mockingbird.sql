CREATE TABLE `prior_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentType` varchar(100) NOT NULL,
	`assessmentLabel` varchar(255) NOT NULL,
	`data` json,
	`themes` json,
	`rawFileDeleted` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prior_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `prior_assessments` ADD CONSTRAINT `prior_assessments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;