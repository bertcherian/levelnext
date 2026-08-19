ALTER TABLE `early_career_nudge_configs` ADD `cadenceAnchorAt` timestamp;--> statement-breakpoint
ALTER TABLE `early_career_nudge_deliveries` ADD `cadenceWindowKey` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `early_career_nudge_deliveries` ADD CONSTRAINT `early_career_nudge_delivery_window_unique` UNIQUE(`configId`,`recipientUserId`,`cadenceWindowKey`);--> statement-breakpoint
CREATE INDEX `early_career_nudge_schedule_task_uid_idx` ON `early_career_nudge_configs` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `early_career_nudge_delivery_config_window_idx` ON `early_career_nudge_deliveries` (`configId`,`cadenceWindowKey`);