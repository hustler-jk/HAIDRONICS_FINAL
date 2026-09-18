CREATE TABLE `analyticsEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event` varchar(80) NOT NULL,
	`productId` varchar(180),
	`query` varchar(180),
	`path` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`component` varchar(180) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`reference` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(180) NOT NULL,
	`name` varchar(180) NOT NULL,
	`sku` varchar(80),
	`price` int NOT NULL,
	`shortDescription` text,
	`description` text,
	`category` varchar(80),
	`tags` text,
	`specs` text,
	`imageUrl` text,
	`featured` int NOT NULL DEFAULT 0,
	`hidden` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `projectRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`phone` varchar(80) NOT NULL,
	`projectName` varchar(180),
	`building` text,
	`components` text,
	`budget` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessName` varchar(180) NOT NULL DEFAULT 'HAIDRONICS',
	`whatsappNumber` varchar(40),
	`phone` varchar(80),
	`email` varchar(320),
	`address` text,
	`businessHours` varchar(180),
	`mapsUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`)
);
