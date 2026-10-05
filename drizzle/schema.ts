import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 80 }),
  price: int("price").notNull(),
  shortDescription: text("shortDescription"),
  description: text("description"),
  category: varchar("category", { length: 80 }),
  tags: text("tags"),
  specs: text("specs"),
  imageUrl: text("imageUrl"),
  stockStatus: varchar("stockStatus", { length: 40 }).default("In stock").notNull(),
  stock: int("stock").default(0).notNull(),
  lowStockThreshold: int("lowStockThreshold").default(5).notNull(),
  active: int("active").default(1).notNull(),
  featured: int("featured").default(0).notNull(),
  hidden: int("hidden").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const comboKits = mysqlTable("comboKits", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  tagline: varchar("tagline", { length: 255 }),
  description: text("description"),
  price: int("price").default(0).notNull(),
  featured: int("featured").default(0).notNull(),
  hidden: int("hidden").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const comboKitItems = mysqlTable("comboKitItems", {
  id: int("id").autoincrement().primaryKey(),
  comboKitId: int("comboKitId").notNull(),
  productSlug: varchar("productSlug", { length: 180 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
});

export const projectRequests = mysqlTable("projectRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 80 }).notNull(),
  projectName: varchar("projectName", { length: 180 }),
  building: text("building"),
  components: text("components"),
  budget: varchar("budget", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const productRequests = mysqlTable("productRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  component: varchar("component", { length: 180 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const analyticsEvents = mysqlTable("analyticsEvents", {
  id: int("id").autoincrement().primaryKey(),
  event: varchar("event", { length: 80 }).notNull(),
  productId: varchar("productId", { length: 180 }),
  query: varchar("query", { length: 180 }),
  path: varchar("path", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  businessName: varchar("businessName", { length: 180 }).default("HAIDRONICS").notNull(),
  whatsappNumber: varchar("whatsappNumber", { length: 40 }),
  phone: varchar("phone", { length: 80 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  businessHours: varchar("businessHours", { length: 180 }),
  mapsUrl: text("mapsUrl"),
  instagramUrl: varchar("instagramUrl", { length: 320 }),
  youtubeUrl: varchar("youtubeUrl", { length: 320 }),
  shippingFee: int("shippingFee").default(50).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 40 }).unique(),
  userId: int("userId"),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 80 }).notNull(),
  address: text("address").notNull(),
  items: text("items").notNull(),
  subtotal: int("subtotal").default(0).notNull(),
  shipping: int("shipping").default(0).notNull(),
  calculatedAmount: int("calculatedAmount").default(0).notNull(),
  finalAmount: int("finalAmount").default(0).notNull(),
  total: int("total").notNull(),
  amountOverridden: int("amountOverridden").default(0).notNull(),
  status: varchar("status", { length: 40 }).default("ORDER_REQUESTED").notNull(),
  paymentStatus: varchar("paymentStatus", { length: 30 }).default("PENDING").notNull(),
  invoiceId: varchar("invoiceId", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 80 }),
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(),
  lineTotal: int("lineTotal").notNull(),
});

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  amount: int("amount").notNull(),
  status: varchar("status", { length: 30 }).default("PENDING").notNull(),
  reference: varchar("reference", { length: 160 }),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const inventoryMovements = mysqlTable("inventoryMovements", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  change: int("change").notNull(),
  reason: varchar("reason", { length: 40 }).notNull(),
  orderId: int("orderId"),
  note: text("note"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  amount: int("amount").notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  paymentStatus: varchar("paymentStatus", { length: 30 }).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("adminUserId"),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const customerStories = mysqlTable("customerStories", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  customerName: varchar("customerName", { length: 160 }),
  projectType: varchar("projectType", { length: 120 }),
  caption: text("caption"),
  imageUrl: text("imageUrl"),
  featured: int("featured").default(1).notNull(),
  hidden: int("hidden").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CustomerStory = typeof customerStories.$inferSelect;
export type InsertCustomerStory = typeof customerStories.$inferInsert;
