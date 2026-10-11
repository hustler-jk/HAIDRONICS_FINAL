ALTER TABLE "orders" ADD COLUMN "invoiceEmailStatus" varchar(20) DEFAULT 'NOT_SENT' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoiceEmailSentAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoiceEmailError" text;