CREATE TABLE `career_access_briefings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`briefDate` varchar(10) NOT NULL,
	`brief` json,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `career_access_briefings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `career_access_score_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scoreStrategyClarity` int,
	`scorePositioningStrength` int,
	`scoreOpportunityPipeline` int,
	`scoreRelationshipCapital` int,
	`scoreAccessPathQuality` int,
	`scoreVisibilityPresence` int,
	`scoreNarrativeReadiness` int,
	`scoreMarketTiming` int,
	`scoreCredentialFit` int,
	`scoreNetworkDensity` int,
	`scoreOutreachMomentum` int,
	`scoreConfidenceReadiness` int,
	`compositeScore` int,
	`narrative` text,
	`topActions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `career_access_score_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `career_access_briefings` ADD CONSTRAINT `career_access_briefings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `career_access_score_snapshots` ADD CONSTRAINT `career_access_score_snapshots_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;