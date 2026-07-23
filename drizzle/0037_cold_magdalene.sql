CREATE TABLE `lsos_daily_briefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spId` int NOT NULL,
	`briefDate` varchar(10) NOT NULL,
	`narrative` text NOT NULL,
	`celebrationsJson` json,
	`risksJson` json,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lsos_daily_briefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lsos_missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spId` int NOT NULL,
	`managerId` int NOT NULL,
	`objective` text NOT NULL,
	`whySelected` text NOT NULL,
	`expectedImpact` varchar(255) NOT NULL,
	`effort` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`urgency` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`recommendedConversation` text,
	`likelihoodOfSuccess` int,
	`riskIfIgnored` text,
	`channel` enum('call','whatsapp','email','voice_note','in_person') NOT NULL DEFAULT 'call',
	`followUpDate` timestamp,
	`priorityScore` int NOT NULL DEFAULT 50,
	`missionType` enum('quick_win','recovery','celebration','stretch','re_engagement','escalation') NOT NULL DEFAULT 'quick_win',
	`status` enum('pending','completed','skipped','snoozed') NOT NULL DEFAULT 'pending',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `lsos_missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `lsos_daily_briefs` ADD CONSTRAINT `lsos_daily_briefs_spId_users_id_fk` FOREIGN KEY (`spId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lsos_missions` ADD CONSTRAINT `lsos_missions_spId_users_id_fk` FOREIGN KEY (`spId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lsos_missions` ADD CONSTRAINT `lsos_missions_managerId_users_id_fk` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;