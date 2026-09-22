ALTER TABLE `war_room_audit_events` MODIFY COLUMN `tenantId` int;--> statement-breakpoint
ALTER TABLE `war_room_campaigns` MODIFY COLUMN `tenantId` int;--> statement-breakpoint
ALTER TABLE `war_room_constraints` MODIFY COLUMN `tenantId` int;--> statement-breakpoint
ALTER TABLE `war_room_decisions` MODIFY COLUMN `tenantId` int;--> statement-breakpoint
ALTER TABLE `war_room_evidence_assessments` MODIFY COLUMN `tenantId` int;--> statement-breakpoint
ALTER TABLE `war_room_evidence_items` MODIFY COLUMN `tenantId` int;--> statement-breakpoint
ALTER TABLE `war_room_orders` MODIFY COLUMN `tenantId` int;--> statement-breakpoint
ALTER TABLE `war_room_reviews` MODIFY COLUMN `tenantId` int;--> statement-breakpoint
ALTER TABLE `war_room_audit_events` ADD `productKey` varchar(80) DEFAULT 'manager_effectiveness' NOT NULL;--> statement-breakpoint
ALTER TABLE `war_room_campaigns` ADD `productKey` varchar(80) DEFAULT 'manager_effectiveness' NOT NULL;--> statement-breakpoint
ALTER TABLE `war_room_constraints` ADD `productKey` varchar(80) DEFAULT 'manager_effectiveness' NOT NULL;--> statement-breakpoint
ALTER TABLE `war_room_decisions` ADD `productKey` varchar(80) DEFAULT 'manager_effectiveness' NOT NULL;--> statement-breakpoint
ALTER TABLE `war_room_evidence_assessments` ADD `productKey` varchar(80) DEFAULT 'manager_effectiveness' NOT NULL;--> statement-breakpoint
ALTER TABLE `war_room_evidence_items` ADD `productKey` varchar(80) DEFAULT 'manager_effectiveness' NOT NULL;--> statement-breakpoint
ALTER TABLE `war_room_orders` ADD `productKey` varchar(80) DEFAULT 'manager_effectiveness' NOT NULL;--> statement-breakpoint
ALTER TABLE `war_room_reviews` ADD `productKey` varchar(80) DEFAULT 'manager_effectiveness' NOT NULL;--> statement-breakpoint
CREATE INDEX `war_room_audit_product_created_idx` ON `war_room_audit_events` (`productKey`,`createdAt`);--> statement-breakpoint
CREATE INDEX `war_room_campaigns_product_status_idx` ON `war_room_campaigns` (`productKey`,`status`);--> statement-breakpoint
CREATE INDEX `war_room_constraints_product_campaign_idx` ON `war_room_constraints` (`productKey`,`campaignId`,`status`);--> statement-breakpoint
CREATE INDEX `war_room_decisions_product_campaign_idx` ON `war_room_decisions` (`productKey`,`campaignId`,`outcome`);--> statement-breakpoint
CREATE INDEX `war_room_assessments_product_campaign_idx` ON `war_room_evidence_assessments` (`productKey`,`campaignId`,`reviewStatus`);--> statement-breakpoint
CREATE INDEX `war_room_evidence_product_campaign_idx` ON `war_room_evidence_items` (`productKey`,`campaignId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `war_room_orders_product_campaign_idx` ON `war_room_orders` (`productKey`,`campaignId`,`status`);--> statement-breakpoint
CREATE INDEX `war_room_reviews_product_campaign_idx` ON `war_room_reviews` (`productKey`,`campaignId`,`reviewDate`);