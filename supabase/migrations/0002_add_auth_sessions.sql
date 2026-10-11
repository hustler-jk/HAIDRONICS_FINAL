CREATE TABLE "authSessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tokenHash" varchar(64) NOT NULL,
	"previousTokenHash" varchar(64),
	"previousValidUntil" timestamp with time zone,
	"idleExpiresAt" timestamp with time zone NOT NULL,
	"absoluteExpiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastUsedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authSessions_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
ALTER TABLE "authSessions" ADD CONSTRAINT "authSessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "authSessions_userId_idx" ON "authSessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "authSessions_previousTokenHash_idx" ON "authSessions" USING btree ("previousTokenHash");--> statement-breakpoint
ALTER TABLE public."authSessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE public."authSessions" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL PRIVILEGES ON SEQUENCE public."authSessions_id_seq" FROM anon, authenticated;