CREATE TABLE "emailVerificationTokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tokenHash" varchar(64) NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "emailVerificationTokens_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "emailVerificationTokens" ADD CONSTRAINT "emailVerificationTokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "emailVerificationTokens_userId_idx" ON "emailVerificationTokens" USING btree ("userId");
--> statement-breakpoint
-- Preserve access for accounts that existed before email verification was enabled.
UPDATE "users" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL AND "password" IS NOT NULL;
