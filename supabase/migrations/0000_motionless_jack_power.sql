CREATE TYPE "user_role" AS ENUM ('user', 'admin');
--> statement-breakpoint
CREATE TABLE "analyticsEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"event" varchar(80) NOT NULL,
	"productId" varchar(180),
	"query" varchar(180),
	"path" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"adminUserId" integer,
	"action" varchar(80) NOT NULL,
	"entityType" varchar(50),
	"entityId" integer,
	"details" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comboKitItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"comboKitId" integer NOT NULL,
	"productSlug" varchar(180) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comboKits" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(180) NOT NULL,
	"name" varchar(180) NOT NULL,
	"tagline" varchar(255),
	"description" text,
	"price" integer DEFAULT 0 NOT NULL,
	"featured" integer DEFAULT 0 NOT NULL,
	"hidden" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comboKits_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "customerStories" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(180) NOT NULL,
	"customerName" varchar(160),
	"projectType" varchar(120),
	"caption" text,
	"imageUrl" text,
	"featured" integer DEFAULT 1 NOT NULL,
	"hidden" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventoryMovements" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"change" integer NOT NULL,
	"reason" varchar(40) NOT NULL,
	"orderId" integer,
	"note" text,
	"createdBy" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletterSubscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletterSubscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "orderItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"productId" integer NOT NULL,
	"productName" varchar(180) NOT NULL,
	"sku" varchar(80),
	"quantity" integer NOT NULL,
	"unitPrice" integer NOT NULL,
	"lineTotal" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderNumber" varchar(40),
	"userId" integer,
	"customerName" varchar(160) NOT NULL,
	"phone" varchar(80) NOT NULL,
	"address" text NOT NULL,
	"items" text NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"shipping" integer DEFAULT 0 NOT NULL,
	"calculatedAmount" integer DEFAULT 0 NOT NULL,
	"finalAmount" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"amountOverridden" integer DEFAULT 0 NOT NULL,
	"status" varchar(40) DEFAULT 'ORDER_REQUESTED' NOT NULL,
	"paymentStatus" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"invoiceId" varchar(80),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_orderNumber_unique" UNIQUE("orderNumber")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"amount" integer NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"reference" varchar(160),
	"verifiedBy" integer,
	"verifiedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"component" varchar(180) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"reference" text,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(180) NOT NULL,
	"name" varchar(180) NOT NULL,
	"sku" varchar(80),
	"price" integer NOT NULL,
	"shortDescription" text,
	"description" text,
	"category" varchar(80),
	"tags" text,
	"specs" text,
	"imageUrl" text,
	"stockStatus" varchar(40) DEFAULT 'In stock' NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"lowStockThreshold" integer DEFAULT 5 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"featured" integer DEFAULT 0 NOT NULL,
	"hidden" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "projectRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"name" varchar(160) NOT NULL,
	"phone" varchar(80) NOT NULL,
	"projectName" varchar(180),
	"building" text,
	"components" text,
	"budget" varchar(80),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "siteSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"businessName" varchar(180) DEFAULT 'HAIDRONICS' NOT NULL,
	"whatsappNumber" varchar(40),
	"phone" varchar(80),
	"email" varchar(320),
	"address" text,
	"businessHours" varchar(180),
	"mapsUrl" text,
	"instagramUrl" varchar(320),
	"youtubeUrl" varchar(320),
	"shippingFee" integer DEFAULT 50 NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"amount" integer NOT NULL,
	"type" varchar(30) NOT NULL,
	"paymentStatus" varchar(30) NOT NULL,
	"createdBy" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"phone" varchar(80),
	"address" text,
	"password" text,
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE INDEX "analyticsEvents_createdAt_idx" ON "analyticsEvents" USING btree ("createdAt");
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_cron;
--> statement-breakpoint
SELECT cron.schedule(
  'purge-technical-analytics-events',
  '0 3 * * *',
  $$DELETE FROM public."analyticsEvents"
    WHERE "createdAt" < now() - interval '3 months'$$
);