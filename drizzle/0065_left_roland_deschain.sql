CREATE TABLE `sales_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`situationId` int NOT NULL,
	`userId` int NOT NULL,
	`category` enum('fact','evidence','interpretation','assumption','hope') NOT NULL,
	`statement` text NOT NULL,
	`confidence` enum('low','moderate','high') NOT NULL DEFAULT 'low',
	`source` varchar(255) NOT NULL DEFAULT 'seller narrative',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_commitments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`situationId` int NOT NULL,
	`action` text NOT NULL,
	`stakeholder` varchar(255),
	`intendedBehaviour` text,
	`dueDate` timestamp,
	`status` enum('pending','completed','not_done') NOT NULL DEFAULT 'pending',
	`reflection` text,
	`outcome` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_commitments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_situations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`accountName` varchar(255),
	`rawSituation` text NOT NULL,
	`desiredOutcome` text,
	`status` enum('active','committed','reflected','archived') NOT NULL DEFAULT 'active',
	`judgment` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_situations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sales_claims` ADD CONSTRAINT `sales_claims_situationId_sales_situations_id_fk` FOREIGN KEY (`situationId`) REFERENCES `sales_situations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales_claims` ADD CONSTRAINT `sales_claims_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales_commitments` ADD CONSTRAINT `sales_commitments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales_commitments` ADD CONSTRAINT `sales_commitments_situationId_sales_situations_id_fk` FOREIGN KEY (`situationId`) REFERENCES `sales_situations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales_situations` ADD CONSTRAINT `sales_situations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sales_claims_situation_idx` ON `sales_claims` (`situationId`);--> statement-breakpoint
CREATE INDEX `sales_claims_user_idx` ON `sales_claims` (`userId`);--> statement-breakpoint
CREATE INDEX `sales_commitments_user_status_idx` ON `sales_commitments` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `sales_commitments_situation_idx` ON `sales_commitments` (`situationId`);--> statement-breakpoint
CREATE INDEX `sales_situations_user_updated_idx` ON `sales_situations` (`userId`,`updatedAt`);