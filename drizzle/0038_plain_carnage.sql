CREATE TABLE `outplacement_enquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`title` varchar(200) NOT NULL,
	`organisation` varchar(300) NOT NULL,
	`email` varchar(300) NOT NULL,
	`phone` varchar(50),
	`cohortSize` varchar(50),
	`message` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outplacement_enquiries_id` PRIMARY KEY(`id`)
);
