CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `claims` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`voucher_id` text NOT NULL,
	`code` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`created_at` text NOT NULL,
	`redeemed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `claim_once` ON `claims` (`user_id`,`voucher_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `claim_code` ON `claims` (`code`);--> statement-breakpoint
CREATE TABLE `entities` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`event_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registration_once` ON `registrations` (`user_id`,`event_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`user_id` text,
	`data` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`membership` text DEFAULT 'inactive' NOT NULL,
	`expires` text,
	`disabled` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
