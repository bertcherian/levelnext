CREATE TABLE `product_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(50) NOT NULL,
	`moduleCode` varchar(20) NOT NULL,
	`moduleName` varchar(255) NOT NULL,
	`moduleDescription` text,
	`sequenceOrder` int NOT NULL,
	`isEntryPoint` boolean NOT NULL DEFAULT false,
	`prerequisiteCode` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`tagline` varchar(255),
	`coachRole` varchar(100) NOT NULL,
	`coachName` varchar(100) NOT NULL DEFAULT 'Guide',
	`coachPrompt` text NOT NULL,
	`practiceCoachPrompt` text,
	`primaryOutcomes` json,
	`journeyStages` json,
	`accentColor` varchar(50) DEFAULT 'var(--color-ln-yellow)',
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_product_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` varchar(50) NOT NULL,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`enrolledBy` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_product_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assessment_sessions` MODIFY COLUMN `moduleType` enum('ECI','TII','LII','GCC','LDI','STI','CPI','CRS','CMK','CST','CAO','AIR') NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_missions` MODIFY COLUMN `moduleType` enum('ECI','TII','LII','GCC','LDI','STI','GENERAL','CPI','CRS','CMK','CST','CAO','AIR') NOT NULL DEFAULT 'GENERAL';--> statement-breakpoint
ALTER TABLE `diagnostic_unlock_progress` MODIFY COLUMN `fromModule` enum('ECI','TII','LII','GCC','LDI','STI','CPI','CRS','CMK','CST','CAO','AIR') NOT NULL;--> statement-breakpoint
ALTER TABLE `diagnostic_unlock_progress` MODIFY COLUMN `toModule` enum('ECI','TII','LII','GCC','LDI','STI','CPI','CRS','CMK','CST','CAO','AIR') NOT NULL;--> statement-breakpoint
ALTER TABLE `guide_sessions` MODIFY COLUMN `moduleType` enum('ECI','TII','LII','GCC','LDI','STI','GENERAL','CPI','CRS','CMK','CST','CAO','AIR') NOT NULL DEFAULT 'GENERAL';--> statement-breakpoint
ALTER TABLE `reports` MODIFY COLUMN `moduleType` enum('ECI','TII','LII','GCC','LDI','STI','CPI','CRS','CMK','CST','CAO','AIR') NOT NULL;--> statement-breakpoint
ALTER TABLE `product_modules` ADD CONSTRAINT `product_modules_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_product_enrollments` ADD CONSTRAINT `user_product_enrollments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_product_enrollments` ADD CONSTRAINT `user_product_enrollments_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_product_enrollments` ADD CONSTRAINT `user_product_enrollments_enrolledBy_users_id_fk` FOREIGN KEY (`enrolledBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;