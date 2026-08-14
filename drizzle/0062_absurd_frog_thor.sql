CREATE TABLE `executive_decision_journal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`decision` text NOT NULL,
	`context` text NOT NULL,
	`assumptions` json,
	`options` json,
	`tradeOffs` text,
	`stakeholders` text,
	`expectedOutcome` text,
	`confidence` int,
	`reviewDate` timestamp,
	`analysis` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `executive_decision_journal_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `executive_mandates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`priorities` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `executive_mandates_id` PRIMARY KEY(`id`),
	CONSTRAINT `executive_mandates_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `executive_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`roleTitle` varchar(180),
	`roleType` varchar(80),
	`businessName` varchar(180),
	`businessDescription` text,
	`geography` varchar(160),
	`scopeDescription` text,
	`mandateStatement` text,
	`transitionMode` varchar(40) NOT NULL DEFAULT 'executive_performance',
	`runAttention` int NOT NULL DEFAULT 0,
	`transformAttention` int NOT NULL DEFAULT 0,
	`buildAttention` int NOT NULL DEFAULT 0,
	`stakeholderSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `executive_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `executive_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `executive_decision_journal` ADD CONSTRAINT `executive_decision_journal_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `executive_mandates` ADD CONSTRAINT `executive_mandates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `executive_profiles` ADD CONSTRAINT `executive_profiles_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `executive_profiles` ADD CONSTRAINT `executive_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `executive_decisions_user_created_idx` ON `executive_decision_journal` (`userId`,`createdAt`);