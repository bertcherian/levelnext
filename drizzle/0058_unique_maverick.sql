CREATE TABLE `ic_self_leadership_mirrors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`sourceApp` varchar(80) NOT NULL,
	`careerStage` enum('early_career','professional','manager','leader','cxo') NOT NULL,
	`primaryDimension` enum('self_awareness','authenticity','courage','responsibility','other_centredness','integrity') NOT NULL,
	`confidence` enum('low','moderate','high') NOT NULL,
	`situation` text NOT NULL,
	`observedBehaviour` text,
	`analysis` json NOT NULL,
	`relevance` enum('up','down'),
	`experimentStatus` enum('not_started','attempted') NOT NULL DEFAULT 'not_started',
	`feedbackNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ic_self_leadership_mirrors_id` PRIMARY KEY(`id`),
	CONSTRAINT `ic_sl_mirrors_user_created_idx` UNIQUE(`userId`,`createdAt`)
);
--> statement-breakpoint
ALTER TABLE `ic_self_leadership_mirrors` ADD CONSTRAINT `ic_self_leadership_mirrors_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ic_self_leadership_mirrors` ADD CONSTRAINT `ic_self_leadership_mirrors_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;