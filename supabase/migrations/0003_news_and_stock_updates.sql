CREATE TABLE "storeUpdates" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" varchar(24) NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" text,
	"url" text,
	"imageUrl" text,
	"active" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "storeUpdates_createdAt_idx" ON "storeUpdates" USING btree ("createdAt");
--> statement-breakpoint
ALTER TABLE public."storeUpdates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE public."storeUpdates" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL PRIVILEGES ON SEQUENCE public."storeUpdates_id_seq" FROM anon, authenticated;