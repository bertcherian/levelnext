CREATE TABLE `lead_captures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(200),
	`source` varchar(64) NOT NULL DEFAULT 'sample_report',
	`moduleCode` varchar(16),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_captures_id` PRIMARY KEY(`id`)
);
