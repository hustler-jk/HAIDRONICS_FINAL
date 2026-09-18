CREATE TABLE `comboKitItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`comboKitId` int NOT NULL,
	`productSlug` varchar(180) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	CONSTRAINT `comboKitItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comboKits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(180) NOT NULL,
	`name` varchar(180) NOT NULL,
	`tagline` varchar(255),
	`description` text,
	`price` int NOT NULL DEFAULT 0,
	`featured` int NOT NULL DEFAULT 0,
	`hidden` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comboKits_id` PRIMARY KEY(`id`),
	CONSTRAINT `comboKits_slug_unique` UNIQUE(`slug`)
);
