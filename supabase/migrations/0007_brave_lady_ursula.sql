CREATE TABLE "productCategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "productCategories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
INSERT INTO "productCategories" ("name") VALUES
	('Development boards'),
	('Boards'),
	('Sensors'),
	('Displays'),
	('Communication'),
	('Robotics'),
	('Power'),
	('LEDs'),
	('Components'),
	('Prototyping'),
	('Wiring'),
	('Accessories'),
	('Modules')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "productCategories" ("name")
SELECT DISTINCT "category"
FROM "products"
WHERE "category" IS NOT NULL AND btrim("category") <> ''
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_productCategories_name_fk" FOREIGN KEY ("category") REFERENCES "public"."productCategories"("name") ON DELETE restrict ON UPDATE no action;