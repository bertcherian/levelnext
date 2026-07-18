CREATE TABLE `org_intelligence_waitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`orgName` varchar(255),
	`role` varchar(255),
	`useCase` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `org_intelligence_waitlist_id` PRIMARY KEY(`id`)
);
