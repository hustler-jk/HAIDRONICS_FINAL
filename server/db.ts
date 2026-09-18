import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { analyticsEvents, InsertProduct, products, productRequests, projectRequests, siteSettings, InsertUser, users } from "../drizzle/schema";
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
export async function getCatalogProduct(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result[0];
}
export async function createCatalogProduct(product: InsertProduct) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.insert(products).values(product);
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
export async function recordAnalyticsEvent(input: typeof analyticsEvents.$inferInsert) {
  const db = await getDb(); if (!db) return;
  return db.insert(analyticsEvents).values(input);
}
export async function getSiteSettings() {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(siteSettings).limit(1);
  return result[0];
}
