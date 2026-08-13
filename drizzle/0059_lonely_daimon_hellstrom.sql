ALTER TABLE `ic_self_leadership_mirrors` DROP INDEX `ic_sl_mirrors_user_created_idx`;--> statement-breakpoint
CREATE INDEX `ic_sl_mirrors_user_fk_idx` ON `ic_self_leadership_mirrors` (`userId`);
--> statement-breakpoint
DROP INDEX `ic_sl_mirrors_user_created_idx` ON `ic_self_leadership_mirrors`;
--> statement-breakpoint
CREATE INDEX `ic_sl_mirrors_user_created_idx` ON `ic_self_leadership_mirrors` (`userId`,`createdAt`);
