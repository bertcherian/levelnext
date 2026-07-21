CREATE TABLE `coach_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`clientUserId` int NOT NULL,
	`notes` text,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`assignedBy` int,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `coach_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`bio` text,
	`specialisation` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coaches_id` PRIMARY KEY(`id`),
	CONSTRAINT `coaches_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `coach_assignments` ADD CONSTRAINT `coach_assignments_coachId_coaches_id_fk` FOREIGN KEY (`coachId`) REFERENCES `coaches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_assignments` ADD CONSTRAINT `coach_assignments_clientUserId_users_id_fk` FOREIGN KEY (`clientUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coach_assignments` ADD CONSTRAINT `coach_assignments_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coaches` ADD CONSTRAINT `coaches_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;