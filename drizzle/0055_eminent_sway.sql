CREATE TABLE `launch_mission_reflections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`missionId` varchar(100) NOT NULL,
	`missionDate` varchar(10) NOT NULL,
	`missionTitle` varchar(255) NOT NULL,
	`reflectionText` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launch_mission_reflections_id` PRIMARY KEY(`id`),
	CONSTRAINT `launch_mission_reflection_unique` UNIQUE(`userId`,`missionId`)
);
--> statement-breakpoint
ALTER TABLE `launch_mission_reflections` ADD CONSTRAINT `launch_mission_reflections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;