CREATE TABLE `ei_prompt_evaluation_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promptVersionId` int NOT NULL,
	`agentCode` enum('self_leadership_intelligence','success_partner_nudges') NOT NULL,
	`caseCode` varchar(120) NOT NULL,
	`status` enum('passed','failed','blocked') NOT NULL,
	`score` int NOT NULL,
	`evidence` json NOT NULL,
	`failureReasons` json NOT NULL,
	`runByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ei_prompt_evaluation_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ei_prompt_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentCode` enum('self_leadership_intelligence','success_partner_nudges') NOT NULL,
	`versionLabel` varchar(120) NOT NULL,
	`modelId` varchar(120) NOT NULL,
	`promptHash` varchar(100) NOT NULL,
	`status` enum('draft','candidate','approved','retired') NOT NULL DEFAULT 'draft',
	`createdByUserId` int,
	`approvedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ei_prompt_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `ei_prompt_versions_agent_version_uq` UNIQUE(`agentCode`,`versionLabel`)
);
--> statement-breakpoint
ALTER TABLE `ei_prompt_evaluation_runs` ADD CONSTRAINT `ei_prompt_evaluation_runs_promptVersionId_ei_prompt_versions_id_fk` FOREIGN KEY (`promptVersionId`) REFERENCES `ei_prompt_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_prompt_evaluation_runs` ADD CONSTRAINT `ei_prompt_evaluation_runs_runByUserId_users_id_fk` FOREIGN KEY (`runByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_prompt_versions` ADD CONSTRAINT `ei_prompt_versions_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ei_prompt_versions` ADD CONSTRAINT `ei_prompt_versions_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ei_prompt_eval_runs_version_idx` ON `ei_prompt_evaluation_runs` (`promptVersionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ei_prompt_eval_runs_agent_status_idx` ON `ei_prompt_evaluation_runs` (`agentCode`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ei_prompt_versions_agent_status_idx` ON `ei_prompt_versions` (`agentCode`,`status`);