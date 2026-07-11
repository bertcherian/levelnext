CREATE TABLE `pilot_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`company` varchar(255) NOT NULL,
	`companyUrl` varchar(500),
	`teamSize` varchar(50),
	`message` text,
	`status` enum('new','contacted','booked','declined') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pilot_applications_id` PRIMARY KEY(`id`)
);
