ALTER TABLE "products" ADD COLUMN "images" text;
--> statement-breakpoint
ALTER TABLE public."products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE public."products" FROM anon, authenticated;