CREATE TABLE `v3_situation_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`situationId` int NOT NULL,
	`userId` int NOT NULL,
	`route` enum('coach','practice_partner','simulator','diagnostic','clarify') NOT NULL,
	`confidence` float NOT NULL,
	`alternatives` json NOT NULL,
	`evidence` json NOT NULL,
	`decisionMethod` varchar(100) NOT NULL,
	`modelVersion` varchar(100) NOT NULL,
	`escalation` boolean NOT NULL DEFAULT false,
	`clarificationPrompt` text,
	`rationale` text NOT NULL,
	`traceId` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `v3_situation_decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `v3_situation_intakes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`situation` text NOT NULL,
	`intent` enum('talk_it_through','perspective','decide','prepare','practice','challenge','teach','listen') NOT NULL,
	`situationKey` enum('delegation','difficult_feedback','underperformance','stakeholder_challenge','conflict','executive_communication','coaching','accountability','priority_management','managing_up'),
	`situationLabel` varchar(160) NOT NULL,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `v3_situation_intakes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `v3_situation_decisions` ADD CONSTRAINT `v3_situation_decisions_situationId_v3_situation_intakes_id_fk` FOREIGN KEY (`situationId`) REFERENCES `v3_situation_intakes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `v3_situation_decisions` ADD CONSTRAINT `v3_situation_decisions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `v3_situation_intakes` ADD CONSTRAINT `v3_situation_intakes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `v3_situation_decisions_user_created_idx` ON `v3_situation_decisions` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `v3_situation_decisions_situation_idx` ON `v3_situation_decisions` (`situationId`);--> statement-breakpoint
CREATE INDEX `v3_situation_intakes_user_created_idx` ON `v3_situation_intakes` (`userId`,`createdAt`);