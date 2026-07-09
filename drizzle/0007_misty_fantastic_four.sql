ALTER TABLE `reports` ADD `sourceType` enum('in_app','pdf_import') DEFAULT 'in_app' NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` ADD `sourceFileUrl` text;--> statement-breakpoint
ALTER TABLE `reports` ADD `sourceFileKey` text;--> statement-breakpoint
ALTER TABLE `reports` ADD `extractionConfidence` float;--> statement-breakpoint
ALTER TABLE `reports` ADD `originalReportDate` varchar(50);