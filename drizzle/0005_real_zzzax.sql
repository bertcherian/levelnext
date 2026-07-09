ALTER TABLE `assessment_sessions` MODIFY COLUMN `moduleType` enum('ECI','TII','LII','GCC') NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_missions` MODIFY COLUMN `moduleType` enum('ECI','TII','LII','GCC','GENERAL') NOT NULL DEFAULT 'GENERAL';--> statement-breakpoint
ALTER TABLE `diagnostic_unlock_progress` MODIFY COLUMN `fromModule` enum('ECI','TII','LII','GCC') NOT NULL;--> statement-breakpoint
ALTER TABLE `diagnostic_unlock_progress` MODIFY COLUMN `toModule` enum('ECI','TII','LII','GCC') NOT NULL;--> statement-breakpoint
ALTER TABLE `guide_sessions` MODIFY COLUMN `moduleType` enum('ECI','TII','LII','GCC','GENERAL') NOT NULL DEFAULT 'GENERAL';--> statement-breakpoint
ALTER TABLE `reports` MODIFY COLUMN `moduleType` enum('ECI','TII','LII','GCC') NOT NULL;