CREATE TABLE `launch_brand_kit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originStory` text,
	`originStoryRefined` text,
	`valueProposition` text,
	`valuePropositionRefined` text,
	`elevatorPitch30` text,
	`elevatorPitch60` text,
	`linkedinAbout` text,
	`linkedinHeadline` varchar(220),
	`professionalBio` text,
	`originStoryComplete` boolean NOT NULL DEFAULT false,
	`valuePropositionComplete` boolean NOT NULL DEFAULT false,
	`elevatorPitchComplete` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `launch_brand_kit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `launch_career_compass` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`strengthsResponses` json,
	`interestResponses` json,
	`workStyleResponses` json,
	`valuesResponses` json,
	`strengthsScore` float,
	`interestScore` float,
	`workStyleScore` float,
	`valuesScore` float,
	`primaryDirection` varchar(255),
	`secondaryDirection` varchar(255),
	`tertiaryDirection` varchar(255),
	`directionCardJson` json,
	`llmNarrative` text,
	`ccStatus` enum('in_progress','completed') NOT NULL DEFAULT 'in_progress',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launch_career_compass_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `launch_brand_kit` ADD CONSTRAINT `launch_brand_kit_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `launch_career_compass` ADD CONSTRAINT `launch_career_compass_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;