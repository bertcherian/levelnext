CREATE TABLE `client_error_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` enum('lazy_chunk_load_failure','render_failure') NOT NULL,
	`route` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_error_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `client_error_events` ADD CONSTRAINT `client_error_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `client_error_events_created_idx` ON `client_error_events` (`createdAt`);--> statement-breakpoint
CREATE INDEX `client_error_events_type_created_idx` ON `client_error_events` (`eventType`,`createdAt`);