CREATE TABLE `intelligence_decision_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdByUserId` int,
	`feature` varchar(100) NOT NULL,
	`task` varchar(160) NOT NULL,
	`decisionClass` varchar(80) NOT NULL,
	`provider` varchar(80) NOT NULL,
	`model` varchar(160),
	`tier` int NOT NULL,
	`maturity` enum('D0','D1','D2','D3','D4') NOT NULL DEFAULT 'D0',
	`outcome` enum('jev','deterministic_fallback','blocked','error') NOT NULL,
	`confidence` float,
	`latencyMs` int NOT NULL,
	`inputTokens` int,
	`outputTokens` int,
	`contextFields` json NOT NULL,
	`answer` json NOT NULL,
	`fallbackReason` text,
	`explanation` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `intelligence_decision_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intelligence_model_registry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(80) NOT NULL,
	`model` varchar(160) NOT NULL,
	`deploymentType` varchar(40) NOT NULL,
	`ownership` varchar(40) NOT NULL,
	`tier` int NOT NULL,
	`privacyClass` varchar(40) NOT NULL,
	`costNote` text NOT NULL,
	`latencyNote` text NOT NULL,
	`capabilities` json NOT NULL,
	`productionApproved` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `intelligence_model_registry_id` PRIMARY KEY(`id`),
	CONSTRAINT `intelligence_registry_provider_model_uq` UNIQUE(`provider`,`model`)
);
--> statement-breakpoint
ALTER TABLE `intelligence_decision_logs` ADD CONSTRAINT `intelligence_decision_logs_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `intelligence_decisions_created_idx` ON `intelligence_decision_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `intelligence_decisions_task_idx` ON `intelligence_decision_logs` (`decisionClass`,`createdAt`);--> statement-breakpoint
CREATE INDEX `intelligence_decisions_provider_idx` ON `intelligence_decision_logs` (`provider`,`outcome`,`createdAt`);--> statement-breakpoint
CREATE INDEX `intelligence_registry_active_idx` ON `intelligence_model_registry` (`active`,`tier`);