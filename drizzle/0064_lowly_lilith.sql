ALTER TABLE `executive_decision_journal` ADD `reviewStatus` enum('pending','working','mixed','not_working') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `executive_decision_journal` ADD `actualOutcome` text;--> statement-breakpoint
ALTER TABLE `executive_decision_journal` ADD `learning` text;--> statement-breakpoint
ALTER TABLE `executive_decision_journal` ADD `nextTimeChange` text;--> statement-breakpoint
ALTER TABLE `executive_decision_journal` ADD `reviewedAt` timestamp;
--> statement-breakpoint
ALTER TABLE `executive_decision_journal` ADD `reviewStatus` enum('pending','working','mixed','not_working') NOT NULL DEFAULT 'pending';
