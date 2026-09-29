ALTER TABLE `proof_pilot_participants` ADD `lastDailyActionAt` timestamp;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `dailyActionCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `missedActionCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `accessBlockedAt` timestamp;--> statement-breakpoint
ALTER TABLE `proof_pilot_participants` ADD `accessIssue` varchar(255);--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `organisation` varchar(255);--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `sponsorName` varchar(160);--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `whyItMatters` text;--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `cohortSize` int DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `accessLane` enum('instant','corporate_browser','enterprise') DEFAULT 'instant' NOT NULL;--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `pilotStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `securityReviewStatus` enum('not_started','requested','in_review','approved','blocked') DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `securityReviewRequestedAt` timestamp;--> statement-breakpoint
ALTER TABLE `proof_pilots` ADD `securityPackVersion` varchar(40) DEFAULT 'v1' NOT NULL;