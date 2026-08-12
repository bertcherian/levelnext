CREATE TABLE `early_career_commitments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`createdByUserId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`journeyStage` varchar(40) NOT NULL,
	`capabilityId` varchar(80) NOT NULL,
	`dueDate` timestamp,
	`status` enum('planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
	`sharingScope` enum('private','employee_and_manager') NOT NULL DEFAULT 'private',
	`outcome` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `early_career_commitments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `early_career_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`commitmentId` int,
	`capabilityId` varchar(80) NOT NULL,
	`evidenceType` enum('self_report','shared_commitment','practice','manager_confirmation') NOT NULL,
	`privacyScope` enum('private','employee_and_manager') NOT NULL DEFAULT 'private',
	`summary` text NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `early_career_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `early_career_manager_nudges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`managerUserId` int NOT NULL,
	`employeeUserId` int NOT NULL,
	`tenantId` int,
	`nudgeCode` varchar(120) NOT NULL,
	`title` varchar(255) NOT NULL,
	`rationale` text NOT NULL,
	`conversationObjective` text NOT NULL,
	`suggestedQuestions` json NOT NULL,
	`privacyBoundary` text NOT NULL,
	`status` enum('suggested','accepted','dismissed','completed') NOT NULL DEFAULT 'suggested',
	`scheduledFor` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `early_career_manager_nudges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `early_career_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int,
	`managerUserId` int,
	`joiningDate` timestamp,
	`roleTitle` varchar(255),
	`functionName` varchar(150),
	`teamName` varchar(150),
	`journeyStage` enum('orient','deliver','connect','navigate','grow','contribute','accelerate') NOT NULL DEFAULT 'orient',
	`onboardingComplete` boolean NOT NULL DEFAULT false,
	`privacyAcknowledgedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `early_career_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `early_career_profiles_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `early_career_commitments` ADD CONSTRAINT `early_career_commitments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_commitments` ADD CONSTRAINT `early_career_commitments_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_commitments` ADD CONSTRAINT `early_career_commitments_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_evidence` ADD CONSTRAINT `early_career_evidence_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_evidence` ADD CONSTRAINT `early_career_evidence_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_evidence` ADD CONSTRAINT `ec_ev_commitment_fk` FOREIGN KEY (`commitmentId`) REFERENCES `early_career_commitments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_manager_nudges` ADD CONSTRAINT `ec_mn_manager_fk` FOREIGN KEY (`managerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_manager_nudges` ADD CONSTRAINT `ec_mn_employee_fk` FOREIGN KEY (`employeeUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_manager_nudges` ADD CONSTRAINT `ec_mn_tenant_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_profiles` ADD CONSTRAINT `ec_profile_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_profiles` ADD CONSTRAINT `ec_profile_tenant_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `early_career_profiles` ADD CONSTRAINT `ec_profile_manager_fk` FOREIGN KEY (`managerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO `products` (`id`, `name`, `tagline`, `coachRole`, `coachName`, `coachPrompt`, `practiceCoachPrompt`, `primaryOutcomes`, `journeyStages`, `accentColor`, `isActive`, `sortOrder`)
VALUES (
  'early_career_intelligence',
  'Early Career Intelligence',
  'Turn early-career hires into trusted, productive professionals faster.',
  'Early Career Development Partner',
  'LevelNext Guide',
  'You are the LevelNext Early Career Development Partner. Help employees in their first 1,000 days clarify workplace situations, practise useful behaviours, take proportionate action, and reflect on evidence. Use only employee-authorised context. Never infer sensitive traits, expose private reflections, or make performance or employment decisions.',
  'You are the LevelNext Practice Partner. Rehearse workplace conversations at the employee’s chosen difficulty, give focused behavioural feedback, and help the employee choose one real-world action. Do not turn practice into a performance rating.',
  JSON_ARRAY('Faster time-to-effectiveness', 'Reliable delivery', 'Confident workplace communication', 'Evidenced professional growth'),
  JSON_ARRAY('Orient', 'Deliver', 'Connect', 'Navigate', 'Grow', 'Contribute', 'Accelerate'),
  '#D4AF37',
  true,
  7
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`), `tagline` = VALUES(`tagline`), `coachRole` = VALUES(`coachRole`), `coachName` = VALUES(`coachName`), `coachPrompt` = VALUES(`coachPrompt`), `practiceCoachPrompt` = VALUES(`practiceCoachPrompt`), `primaryOutcomes` = VALUES(`primaryOutcomes`), `journeyStages` = VALUES(`journeyStages`), `accentColor` = VALUES(`accentColor`), `isActive` = VALUES(`isActive`), `sortOrder` = VALUES(`sortOrder`);--> statement-breakpoint
INSERT INTO `product_modules` (`productId`, `moduleCode`, `moduleName`, `moduleDescription`, `sequenceOrder`, `isEntryPoint`)
SELECT 'early_career_intelligence', 'EARLY_CAREER', 'Early Career Intelligence', 'Your First 1,000 Days: workplace intelligence, growth actions, evidence, and manager partnership.', 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM `product_modules` WHERE `productId` = 'early_career_intelligence' AND `moduleCode` = 'EARLY_CAREER'
);
