ALTER TABLE `magic_link_tokens` ADD `requestedWhatsappNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `whatsappNumber` varchar(32);