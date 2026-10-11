CREATE TABLE "comboKitRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"comboKitId" integer NOT NULL,
	"userId" integer,
	"customerName" varchar(160) NOT NULL,
	"phone" varchar(80) NOT NULL,
	"address" text NOT NULL,
	"status" varchar(30) DEFAULT 'REQUESTED' NOT NULL,
	"approvedOrderId" integer,
	"adminNote" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comboKitRequests" ADD CONSTRAINT "comboKitRequests_comboKitId_comboKits_id_fk" FOREIGN KEY ("comboKitId") REFERENCES "public"."comboKits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comboKitRequests" ADD CONSTRAINT "comboKitRequests_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comboKitRequests_status_createdAt_idx" ON "comboKitRequests" USING btree ("status","createdAt");