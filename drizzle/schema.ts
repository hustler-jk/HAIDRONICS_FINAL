import { index, integer, numeric, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestampColumn = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const updatedTimestampColumn = (name: string) => timestampColumn(name).defaultNow().notNull().$onUpdate(() => new Date());
const userRole = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 80 }),
  address: text("address"),
  password: text("password"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
  updatedAt: updatedTimestampColumn("updatedAt"),
  lastSignedIn: timestampColumn("lastSignedIn").defaultNow().notNull(),
  emailVerifiedAt: timestampColumn("emailVerifiedAt"),
}, (table) => [uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`).where(sql`${table.email} is not null`)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const emailVerificationTokens = pgTable("emailVerificationTokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestampColumn("expiresAt").notNull(),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
}, (table) => [index("emailVerificationTokens_userId_idx").on(table.userId)]);

export const authSessions = pgTable("authSessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  previousTokenHash: varchar("previousTokenHash", { length: 64 }),
  previousValidUntil: timestampColumn("previousValidUntil"),
  idleExpiresAt: timestampColumn("idleExpiresAt").notNull(),
  absoluteExpiresAt: timestampColumn("absoluteExpiresAt").notNull(),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
  lastUsedAt: timestampColumn("lastUsedAt").defaultNow().notNull(),
}, (table) => [
  index("authSessions_userId_idx").on(table.userId),
  index("authSessions_previousTokenHash_idx").on(table.previousTokenHash),
]);

export const productCategories = pgTable("productCategories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 80 }),
  price: numeric("price", { precision: 12, scale: 2, mode: "number" }).notNull(),
  shortDescription: text("shortDescription"),
  description: text("description"),
  category: varchar("category", { length: 80 }).references(() => productCategories.name, { onDelete: "restrict" }),
  tags: text("tags"),
  specs: text("specs"),
  imageUrl: text("imageUrl"),
  images: text("images"),
  stockStatus: varchar("stockStatus", { length: 40 }).default("In stock").notNull(),
  stock: integer("stock").default(0).notNull(),
  lowStockThreshold: integer("lowStockThreshold").default(5).notNull(),
  active: integer("active").default(1).notNull(),
  featured: integer("featured").default(0).notNull(),
  hidden: integer("hidden").default(0).notNull(),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
  updatedAt: updatedTimestampColumn("updatedAt"),
});
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const comboKits = pgTable("comboKits", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  tagline: varchar("tagline", { length: 255 }),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
  featured: integer("featured").default(0).notNull(),
  hidden: integer("hidden").default(0).notNull(),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
  updatedAt: updatedTimestampColumn("updatedAt"),
});

export const comboKitItems = pgTable("comboKitItems", {
  id: serial("id").primaryKey(),
  comboKitId: integer("comboKitId").notNull(),
  productSlug: varchar("productSlug", { length: 180 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
});

export const comboKitRequests = pgTable("comboKitRequests", {
  id: serial("id").primaryKey(),
  comboKitId: integer("comboKitId").notNull().references(() => comboKits.id, { onDelete: "restrict" }),
  userId: integer("userId").references(() => users.id, { onDelete: "set null" }),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 80 }).notNull(),
  address: text("address").notNull(),
  status: varchar("status", { length: 30 }).default("REQUESTED").notNull(),
  approvedOrderId: integer("approvedOrderId"),
  adminNote: text("adminNote"),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
  updatedAt: updatedTimestampColumn("updatedAt"),
}, (table) => [index("comboKitRequests_status_createdAt_idx").on(table.status, table.createdAt)]);

export const projectRequests = pgTable("projectRequests", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 80 }).notNull(),
  projectName: varchar("projectName", { length: 180 }),
  building: text("building"),
  components: text("components"),
  budget: varchar("budget", { length: 80 }),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
});

export const productRequests = pgTable("productRequests", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  component: varchar("component", { length: 180 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
});

export const analyticsEvents = pgTable("analyticsEvents", {
  id: serial("id").primaryKey(),
  event: varchar("event", { length: 80 }).notNull(),
  productId: varchar("productId", { length: 180 }),
  query: varchar("query", { length: 180 }),
  path: varchar("path", { length: 255 }),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
}, (table) => [index("analyticsEvents_createdAt_idx").on(table.createdAt)]);

export const siteSettings = pgTable("siteSettings", {
  id: serial("id").primaryKey(),
  businessName: varchar("businessName", { length: 180 }).default("HAIDRONICS").notNull(),
  whatsappNumber: varchar("whatsappNumber", { length: 40 }),
  phone: varchar("phone", { length: 80 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  businessHours: varchar("businessHours", { length: 180 }),
  mapsUrl: text("mapsUrl"),
  instagramUrl: varchar("instagramUrl", { length: 320 }),
  youtubeUrl: varchar("youtubeUrl", { length: 320 }),
  shippingFee: numeric("shippingFee", { precision: 12, scale: 2, mode: "number" }).default(50).notNull(),
  updatedAt: updatedTimestampColumn("updatedAt"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 40 }).unique(),
  userId: integer("userId"),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 80 }).notNull(),
  address: text("address").notNull(),
  items: text("items").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
  shipping: numeric("shipping", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
  calculatedAmount: numeric("calculatedAmount", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
  finalAmount: numeric("finalAmount", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
  total: numeric("total", { precision: 12, scale: 2, mode: "number" }).notNull(),
  amountOverridden: integer("amountOverridden").default(0).notNull(),
  status: varchar("status", { length: 40 }).default("ORDER_REQUESTED").notNull(),
  paymentStatus: varchar("paymentStatus", { length: 30 }).default("PENDING").notNull(),
  invoiceId: varchar("invoiceId", { length: 80 }),
  invoiceEmailStatus: varchar("invoiceEmailStatus", { length: 20 }).default("NOT_SENT").notNull(),
  invoiceEmailSentAt: timestampColumn("invoiceEmailSentAt"),
  invoiceEmailError: text("invoiceEmailError"),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
});

export const orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  productId: integer("productId").notNull(),
  productName: varchar("productName", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 80 }),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unitPrice", { precision: 12, scale: 2, mode: "number" }).notNull(),
  lineTotal: numeric("lineTotal", { precision: 12, scale: 2, mode: "number" }).notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  status: varchar("status", { length: 30 }).default("PENDING").notNull(),
  reference: varchar("reference", { length: 160 }),
  verifiedBy: integer("verifiedBy"),
  verifiedAt: timestampColumn("verifiedAt"),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
});

export const inventoryMovements = pgTable("inventoryMovements", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull(),
  change: integer("change").notNull(),
  reason: varchar("reason", { length: 40 }).notNull(),
  orderId: integer("orderId"),
  note: text("note"),
  createdBy: integer("createdBy"),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  paymentStatus: varchar("paymentStatus", { length: 30 }).notNull(),
  createdBy: integer("createdBy"),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
});

export const auditLogs = pgTable("auditLogs", {
  id: serial("id").primaryKey(),
  adminUserId: integer("adminUserId"),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entityType", { length: 50 }),
  entityId: integer("entityId"),
  details: text("details"),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
});

export const newsletterSubscribers = pgTable("newsletterSubscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
});

export const customerStories = pgTable("customerStories", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  customerName: varchar("customerName", { length: 160 }),
  projectType: varchar("projectType", { length: 120 }),
  caption: text("caption"),
  imageUrl: text("imageUrl"),
  featured: integer("featured").default(1).notNull(),
  hidden: integer("hidden").default(0).notNull(),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
  updatedAt: updatedTimestampColumn("updatedAt"),
});
export type CustomerStory = typeof customerStories.$inferSelect;
export type InsertCustomerStory = typeof customerStories.$inferInsert;

export const storeUpdates = pgTable("storeUpdates", {
  id: serial("id").primaryKey(),
  kind: varchar("kind", { length: 24 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body"),
  url: text("url"),
  imageUrl: text("imageUrl"),
  active: integer("active").default(1).notNull(),
  createdAt: timestampColumn("createdAt").defaultNow().notNull(),
}, (table) => [index("storeUpdates_createdAt_idx").on(table.createdAt)]);
export type StoreUpdate = typeof storeUpdates.$inferSelect;
export type InsertStoreUpdate = typeof storeUpdates.$inferInsert;
