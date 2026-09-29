CREATE TABLE `pilotlab_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`managerKey` varchar(32) NOT NULL,
	`name` varchar(160) NOT NULL,
	`role` varchar(160) NOT NULL,
	`trajectory` enum('resistant_breakthrough','false_positive','improvement_relapse_recovery','slow_compounder','already_strong') NOT NULL,
	`groundTruth` json NOT NULL,
	`managerReality` json NOT NULL,
	`levelNextReality` json NOT NULL,
	`currentState` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pilotlab_agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `pilotlab_agents_run_manager_uq` UNIQUE(`runId`,`managerKey`)
);
--> statement-breakpoint
CREATE TABLE `pilotlab_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`agentId` int,
	`scenarioCode` varchar(32) NOT NULL,
	`virtualDay` int NOT NULL,
	`actorType` varchar(40) NOT NULL,
	`informationPlane` enum('ground_truth','manager_reality','levelnext_reality','auditor','sponsor') NOT NULL,
	`permittedContext` json NOT NULL,
	`levelNextResponse` text,
	`action` json,
	`stateChange` json,
	`evidenceGenerated` json,
	`evaluatorResult` json,
	`failureCode` varchar(64),
	`severity` enum('informational','warning','significant','critical') NOT NULL DEFAULT 'informational',
	`evidenceLevel` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pilotlab_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pilotlab_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`dimension` varchar(80) NOT NULL,
	`score` int NOT NULL,
	`passed` int NOT NULL DEFAULT 0,
	`failed` int NOT NULL DEFAULT 0,
	`evidence` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pilotlab_results_id` PRIMARY KEY(`id`),
	CONSTRAINT `pilotlab_results_run_dimension_uq` UNIQUE(`runId`,`dimension`)
);
--> statement-breakpoint
CREATE TABLE `pilotlab_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`runCode` varchar(32) NOT NULL,
	`name` varchar(160) NOT NULL,
	`status` enum('draft','running','completed','failed') NOT NULL DEFAULT 'draft',
	`virtualDay` int NOT NULL DEFAULT 0,
	`virtualDurationDays` int NOT NULL DEFAULT 60,
	`managerCount` int NOT NULL DEFAULT 5,
	`interactions` int NOT NULL DEFAULT 0,
	`scenariosTotal` int NOT NULL DEFAULT 50,
	`scenariosExecuted` int NOT NULL DEFAULT 0,
	`summary` json,
	`failureSummary` json,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pilotlab_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `pilotlab_runs_runCode_unique` UNIQUE(`runCode`)
);
--> statement-breakpoint
ALTER TABLE `pilotlab_agents` ADD CONSTRAINT `pilotlab_agents_runId_pilotlab_runs_id_fk` FOREIGN KEY (`runId`) REFERENCES `pilotlab_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pilotlab_events` ADD CONSTRAINT `pilotlab_events_runId_pilotlab_runs_id_fk` FOREIGN KEY (`runId`) REFERENCES `pilotlab_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pilotlab_events` ADD CONSTRAINT `pilotlab_events_agentId_pilotlab_agents_id_fk` FOREIGN KEY (`agentId`) REFERENCES `pilotlab_agents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pilotlab_results` ADD CONSTRAINT `pilotlab_results_runId_pilotlab_runs_id_fk` FOREIGN KEY (`runId`) REFERENCES `pilotlab_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pilotlab_runs` ADD CONSTRAINT `pilotlab_runs_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pilotlab_agents_run_idx` ON `pilotlab_agents` (`runId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `pilotlab_events_run_day_idx` ON `pilotlab_events` (`runId`,`virtualDay`);--> statement-breakpoint
CREATE INDEX `pilotlab_events_agent_day_idx` ON `pilotlab_events` (`agentId`,`virtualDay`);--> statement-breakpoint
CREATE INDEX `pilotlab_events_failure_idx` ON `pilotlab_events` (`runId`,`failureCode`,`severity`);--> statement-breakpoint
CREATE INDEX `pilotlab_results_run_idx` ON `pilotlab_results` (`runId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `pilotlab_runs_owner_created_idx` ON `pilotlab_runs` (`ownerUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `pilotlab_runs_status_idx` ON `pilotlab_runs` (`status`,`updatedAt`);