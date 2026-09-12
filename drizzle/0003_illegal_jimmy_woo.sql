ALTER TABLE `registrations` ADD `status` text DEFAULT 'confirmed' NOT NULL;--> statement-breakpoint
ALTER TABLE `registrations` ADD `details` text DEFAULT '{}' NOT NULL;