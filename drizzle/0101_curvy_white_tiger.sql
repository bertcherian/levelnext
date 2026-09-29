ALTER TABLE `pilotlab_runs` ADD `platformVersion` varchar(80) DEFAULT 'current-preview' NOT NULL;--> statement-breakpoint
ALTER TABLE `pilotlab_runs` ADD `chaosConfig` json;--> statement-breakpoint
ALTER TABLE `pilotlab_runs` ADD `integrationSummary` json;