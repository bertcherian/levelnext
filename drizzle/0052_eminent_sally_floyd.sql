CREATE TABLE `ic_practice_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`diagnosticInstanceId` int NOT NULL,
	`scenarioId` varchar(120) NOT NULL,
	`dimensionId` varchar(80) NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ic_practice_progress_id` PRIMARY KEY(`id`)
);
