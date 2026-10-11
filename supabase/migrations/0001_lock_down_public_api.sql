ALTER TABLE public."analyticsEvents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."auditLogs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."comboKitItems" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."comboKits" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."customerStories" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."inventoryMovements" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."newsletterSubscribers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."orderItems" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."orders" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."payments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."productRequests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."products" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."projectRequests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."siteSettings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."transactions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;
