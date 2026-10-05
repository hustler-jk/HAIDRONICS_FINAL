CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminUserId` int,
	`action` varchar(80) NOT NULL,
	`entityType` varchar(50),
	`entityId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`change` int NOT NULL,
	`reason` varchar(40) NOT NULL,
	`orderId` int,
	`note` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventoryMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(180) NOT NULL,
	`sku` varchar(80),
	`quantity` int NOT NULL,
	`unitPrice` int NOT NULL,
	`lineTotal` int NOT NULL,
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`amount` int NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'PENDING',
	`reference` varchar(160),
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`amount` int NOT NULL,
	`type` varchar(30) NOT NULL,
	`paymentStatus` varchar(30) NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` varchar(40) NOT NULL DEFAULT 'ORDER_REQUESTED';--> statement-breakpoint
ALTER TABLE `orders` ADD `orderNumber` varchar(40);--> statement-breakpoint
ALTER TABLE `orders` ADD `subtotal` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `calculatedAmount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `finalAmount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `amountOverridden` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentStatus` varchar(30) DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `invoiceId` varchar(80);--> statement-breakpoint
ALTER TABLE `products` ADD `stock` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `lowStockThreshold` int DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `active` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`);