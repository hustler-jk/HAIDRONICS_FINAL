import { desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { analyticsEvents, comboKitItems, comboKits, customerStories, InsertProduct, newsletterSubscribers, orders, products, productRequests, projectRequests, siteSettings, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listCatalogProducts() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(products).where(eq(products.hidden, 0)).orderBy(desc(products.createdAt));
}

export async function searchCatalogProducts(query: string) {
  const db = await getDb(); if (!db) return [];
  const term = `%${query.trim()}%`;
  return db.select().from(products).where(or(like(products.name, term), like(products.sku, term), like(products.shortDescription, term), like(products.description, term), like(products.category, term), like(products.tags, term), like(products.specs, term))).orderBy(desc(products.createdAt));
}
export async function getCatalogProduct(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result[0];
}
export async function createCatalogProduct(product: InsertProduct) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.insert(products).values(product);
}
export async function updateCatalogProduct(id: number, product: Partial<InsertProduct>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.update(products).set(product).where(eq(products.id, id));
}
export async function deleteCatalogProduct(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.update(products).set({ hidden: 1 }).where(eq(products.id, id));
}
export async function saveProjectRequest(input: typeof projectRequests.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.insert(projectRequests).values(input);
}
export async function saveProductRequest(input: typeof productRequests.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.insert(productRequests).values(input);
}
export async function createOrder(input: typeof orders.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.insert(orders).values(input);
}
export async function listOrdersForUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}
export async function listRequestsForUser(userId: number) {
  const db = await getDb(); if (!db) return { projects: [], products: [] };
  return {
    projects: await db.select().from(projectRequests).where(eq(projectRequests.userId, userId)).orderBy(desc(projectRequests.createdAt)),
    products: await db.select().from(productRequests).where(eq(productRequests.userId, userId)).orderBy(desc(productRequests.createdAt)),
  };
}
export async function subscribeNewsletter(email: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.insert(newsletterSubscribers).values({ email }).onDuplicateKeyUpdate({ set: { email } });
}
export async function recordAnalyticsEvent(input: typeof analyticsEvents.$inferInsert) {
  const db = await getDb(); if (!db) return;
  return db.insert(analyticsEvents).values(input);
}
export async function getSiteSettings() {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(siteSettings).limit(1);
  return result[0];
}

export async function saveSiteSettings(input: Partial<typeof siteSettings.$inferInsert>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.insert(siteSettings).values({ id: 1, ...input }).onDuplicateKeyUpdate({ set: input });
}

export async function listProjectRequests() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(projectRequests).orderBy(desc(projectRequests.createdAt));
}

export async function listProductRequests() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(productRequests).orderBy(desc(productRequests.createdAt));
}

export async function listAnalyticsEvents() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(analyticsEvents).orderBy(desc(analyticsEvents.createdAt)).limit(500);
}

export async function listComboKits() {
  const db = await getDb(); if (!db) return [];
  const kits = await db.select().from(comboKits).where(eq(comboKits.hidden, 0)).orderBy(desc(comboKits.createdAt));
  return Promise.all(kits.map(async (kit) => ({ ...kit, items: await db.select().from(comboKitItems).where(eq(comboKitItems.comboKitId, kit.id)) })));
}

export async function createComboKit(input: { slug: string; name: string; tagline?: string; description?: string; price: number; featured?: number; items: Array<{ productSlug: string; quantity: number }> }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(comboKits).values({ slug: input.slug, name: input.name, tagline: input.tagline, description: input.description, price: input.price, featured: input.featured ?? 0 });
  const created = await db.select().from(comboKits).where(eq(comboKits.slug, input.slug)).limit(1);
  if (created[0] && input.items.length) await db.insert(comboKitItems).values(input.items.map((item) => ({ comboKitId: created[0].id, productSlug: item.productSlug, quantity: item.quantity })));
}

export async function hideComboKit(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.update(comboKits).set({ hidden: 1 }).where(eq(comboKits.id, id));
}

export async function listCustomerStories() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(customerStories).where(eq(customerStories.hidden, 0)).orderBy(desc(customerStories.createdAt));
}

export async function createCustomerStory(input: typeof customerStories.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.insert(customerStories).values(input);
}

export async function hideCustomerStory(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.update(customerStories).set({ hidden: 1 }).where(eq(customerStories.id, id));
}
