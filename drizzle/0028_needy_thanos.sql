CREATE TABLE `manager_team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(255),
	`notes` text,
	`lastInsight` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manager_team_members_id` PRIMARY KEY(`id`)
);
