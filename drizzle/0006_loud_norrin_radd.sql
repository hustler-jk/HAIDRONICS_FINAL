CREATE TABLE `customerStories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`customerName` varchar(160),
	`projectType` varchar(120),
	`caption` text,
	`imageUrl` text,
	`featured` int NOT NULL DEFAULT 1,
	`hidden` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerStories_id` PRIMARY KEY(`id`)
);
