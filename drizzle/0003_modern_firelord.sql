CREATE TABLE `newsletterSubscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletterSubscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletterSubscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`customerName` varchar(160) NOT NULL,
	`phone` varchar(80) NOT NULL,
	`address` text NOT NULL,
	`items` text NOT NULL,
	`total` int NOT NULL,
	`status` varchar(40) NOT NULL DEFAULT 'whatsapp_pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `productRequests` ADD `userId` int;--> statement-breakpoint
ALTER TABLE `products` ADD `stockStatus` varchar(40) DEFAULT 'In stock' NOT NULL;--> statement-breakpoint
ALTER TABLE `projectRequests` ADD `userId` int;