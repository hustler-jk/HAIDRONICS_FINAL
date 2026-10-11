import { and, asc, desc, eq, gt, gte, ilike, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { billingCatalog } from "@shared/billingCatalog";
import { analyticsEvents, authSessions, auditLogs, comboKitItems, comboKitRequests, comboKits, customerStories, emailVerificationTokens, InsertProduct, InsertStoreUpdate, inventoryMovements, newsletterSubscribers, orderItems, orders, payments, productCategories, products, productRequests, projectRequests, siteSettings, InsertUser, storeUpdates, transactions, users, type User } from "../drizzle/schema";
import { ENV } from './_core/env';
import { sendInvoiceEmail } from "./invoice-email";
import { defaultProductCategories } from "@shared/productCategories";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      const client = postgres(ENV.databaseUrl, { max: 10, prepare: false, ssl: "require" });
      _db = drizzle(client);
    } catch (error) {
      console.error("[Database] Failed to initialize Supabase Postgres connection:", error);
      throw error;
    }
  }
  return _db;
}

export const DEFAULT_SEED_PRODUCTS = [
  {
    id: 1,
    slug: "esp32-devkit",
    name: "ESP32",
    sku: "HD-ESP32-001",
    price: 350,
    shortDescription: "Wi-Fi + Bluetooth development board for connected builds.",
    description: "A capable, compact development board for IoT prototypes, automation builds, sensor networks, and connected experiments.",
    category: "Boards",
    tags: "esp32,wifi,bluetooth,iot,microcontroller",
    specs: JSON.stringify([
      { label: "Microcontroller", value: "ESP32-WROOM-32" },
      { label: "Connectivity", value: "Wi-Fi + Bluetooth BLE" },
      { label: "USB", value: "Micro USB / CP2102" },
      { label: "Logic Voltage", value: "3.3V" },
    ]),
    stockStatus: "In stock",
    stock: 85,
    lowStockThreshold: 10,
    active: 1,
    featured: 1,
    hidden: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    slug: "oled-096",
    name: "OLED 0.96\" Display",
    sku: "HD-OLED-096",
    price: 159,
    shortDescription: "Crisp I2C display for compact dashboards and prototypes.",
    description: "A bright monochrome OLED module that makes quick sensor readouts and portable interfaces easy to build.",
    category: "Displays",
    tags: "oled,display,i2c,ssd1306",
    specs: JSON.stringify([
      { label: "Resolution", value: "128 × 64" },
      { label: "Interface", value: "I2C (0x3C / 0x3D)" },
      { label: "Driver", value: "SSD1306" },
      { label: "Voltage", value: "3.3V – 5V" },
    ]),
    stockStatus: "In stock",
    stock: 50,
    lowStockThreshold: 8,
    active: 1,
    featured: 1,
    hidden: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    slug: "dht11",
    name: "DHT11 Temp & Humidity Sensor",
    sku: "HD-DHT11-011",
    price: 59,
    shortDescription: "A beginner-friendly temperature and humidity sensor module.",
    description: "A simple digital sensor for learning environments, climate monitors, plant projects, and first IoT builds.",
    category: "Sensors",
    tags: "temperature,humidity,sensor,dht11",
    specs: JSON.stringify([
      { label: "Temperature Range", value: "0°C – 50°C (±2°C)" },
      { label: "Humidity Range", value: "20% – 90% RH (±5%)" },
      { label: "Interface", value: "Single-wire digital" },
      { label: "Supply", value: "3.5V to 5.5V" },
    ]),
    stockStatus: "In stock",
    stock: 120,
    lowStockThreshold: 15,
    active: 1,
    featured: 1,
    hidden: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    slug: "arduino-uno",
    name: "Arduino Uno",
    sku: "HD-UNO-R3",
    price: 220,
    shortDescription: "The familiar starting point for classroom and prototype work.",
    description: "A dependable microcontroller board for learning embedded systems, controlling modules, and getting ideas moving.",
    category: "Boards",
    tags: "arduino,uno,atmega328p,microcontroller",
    specs: JSON.stringify([
      { label: "Microcontroller", value: "ATmega328P" },
      { label: "Digital I/O", value: "14 pins (6 PWM)" },
      { label: "Analog Inputs", value: "6 pins" },
      { label: "Operating Voltage", value: "5V" },
    ]),
    stockStatus: "In stock",
    stock: 40,
    lowStockThreshold: 5,
    active: 1,
    featured: 1,
    hidden: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 5,
    slug: "ultrasonic",
    name: "HC-SR04 Ultrasonic Sensor",
    sku: "HD-HCSR04-004",
    price: 79,
    shortDescription: "Non-contact distance sensing for robotics and automation.",
    description: "A classic ultrasonic module for obstacle detection, tank levels, robotics experiments, and interactive builds.",
    category: "Sensors",
    tags: "ultrasonic,distance,robotics,hcsr04",
    specs: JSON.stringify([
      { label: "Range", value: "2cm – 400cm" },
      { label: "Frequency", value: "40kHz" },
      { label: "Trigger / Echo", value: "TTL compatible" },
      { label: "Voltage", value: "5V" },
    ]),
    stockStatus: "In stock",
    stock: 65,
    lowStockThreshold: 10,
    active: 1,
    featured: 0,
    hidden: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 6,
    slug: "relay-2ch",
    name: "2-Channel Relay Module",
    sku: "HD-RELAY-002",
    price: 149,
    shortDescription: "Switch lights, motors, and appliances from your controller.",
    description: "A practical two-channel relay board for automation prototypes and controller-to-load switching experiments.",
    category: "Modules",
    tags: "relay,automation,switch,module",
    specs: JSON.stringify([
      { label: "Channels", value: "2" },
      { label: "Coil Voltage", value: "5V DC" },
      { label: "Contact Rating", value: "10A 250VAC / 10A 30VDC" },
      { label: "Trigger", value: "Optocoupler isolated" },
    ]),
    stockStatus: "In stock",
    stock: 35,
    lowStockThreshold: 5,
    active: 1,
    featured: 0,
    hidden: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 7,
    slug: "pcb-board",
    name: "Double Sided Prototype PCB Board",
    sku: "HD-PCB-001",
    price: 120,
    shortDescription: "High-quality FR4 prototyping perfboard for durable circuits.",
    description: "Double-sided tinned universal PCB prototype board with standard 2.54mm pin pitch for soldering components.",
    category: "Modules",
    tags: "pcb,perfboard,soldering,prototype",
    specs: JSON.stringify([
      { label: "Material", value: "FR-4 Glass Fiber" },
      { label: "Pitch", value: "2.54mm (0.1 inch)" },
      { label: "Hole Diameter", value: "1.0mm" },
      { label: "Plating", value: "Tinned through-hole" },
    ]),
    stockStatus: "In stock",
    stock: 90,
    lowStockThreshold: 15,
    active: 1,
    featured: 1,
    hidden: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  ...billingCatalog
    .filter((product) => !new Set(["esp32-devkit", "oled-096", "dht11", "arduino-uno", "ultrasonic"]).has(product.slug))
    .map((product, index) => ({
      id: 100 + index,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      price: product.price,
      shortDescription: `${product.name} from the HAIDRONICS component catalog.`,
      description: `${product.name} for electronics projects, prototypes, and learning builds.`,
      category: product.category,
      tags: product.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).join(","),
      specs: "[]",
      stockStatus: "Out of stock",
      stock: 0,
      lowStockThreshold: 5,
      active: 1,
      featured: 0,
      hidden: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
];

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "phone", "address", "password", "loginMethod"] as const;
  textFields.forEach((field) => { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.emailVerifiedAt !== undefined) { values.emailVerifiedAt = user.emailVerifiedAt; updateSet.emailVerifiedAt = user.emailVerifiedAt; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: updateSet,
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
  return result[0];
}

export async function saveEmailVerificationToken(userId: number, tokenHash: string, expiresAt: Date) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
  await db.insert(emailVerificationTokens).values({ userId, tokenHash, expiresAt });
}

export async function verifyEmailToken(tokenHash: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const [token] = await tx.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.tokenHash, tokenHash)).limit(1);
    if (!token || token.expiresAt <= new Date()) {
      if (token) await tx.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, token.id));
      return false;
    }
    await tx.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, token.userId));
    await tx.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, token.id));
    return true;
  });
}

export async function createAuthSession(input: {
  userId: number;
  tokenHash: string;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  now: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(authSessions).where(lt(authSessions.absoluteExpiresAt, input.now));
  const [row] = await db.insert(authSessions).values({
    userId: input.userId,
    tokenHash: input.tokenHash,
    idleExpiresAt: input.idleExpiresAt,
    absoluteExpiresAt: input.absoluteExpiresAt,
    createdAt: input.now,
    lastUsedAt: input.now,
  }).returning({ id: authSessions.id });
  if (!row) throw new Error("Failed to create authentication session");
  return row.id;
}

export async function getAuthSessionForRefresh(tokenHash: string, now: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.select({
    sessionId: authSessions.id,
    absoluteExpiresAt: authSessions.absoluteExpiresAt,
    user: users,
  }).from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(and(
      or(
        eq(authSessions.tokenHash, tokenHash),
        and(
          eq(authSessions.previousTokenHash, tokenHash),
          gt(authSessions.previousValidUntil, now),
        ),
      ),
      gt(authSessions.idleExpiresAt, now),
      gt(authSessions.absoluteExpiresAt, now),
    )).limit(1);
  return row ?? null;
}

export async function getUserForAuthSession(sessionId: number, now: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.select({ user: users }).from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(and(
      eq(authSessions.id, sessionId),
      gt(authSessions.idleExpiresAt, now),
      gt(authSessions.absoluteExpiresAt, now),
    )).limit(1);
  return row?.user ?? null;
}

export async function rotateAuthSession(input: {
  currentTokenHash: string;
  nextTokenHash: string;
  now: Date;
  graceUntil: Date;
  idleExpiresAt: Date;
}): Promise<{ status: "rotated" | "grace"; sessionId: number; absoluteExpiresAt: Date; user: User } | null> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [rotated] = await db.update(authSessions).set({
    previousTokenHash: input.currentTokenHash,
    previousValidUntil: input.graceUntil,
    tokenHash: input.nextTokenHash,
    idleExpiresAt: input.idleExpiresAt,
    lastUsedAt: input.now,
  }).where(and(
    eq(authSessions.tokenHash, input.currentTokenHash),
    gt(authSessions.idleExpiresAt, input.now),
    gt(authSessions.absoluteExpiresAt, input.now),
  )).returning({
    userId: authSessions.userId,
    sessionId: authSessions.id,
    absoluteExpiresAt: authSessions.absoluteExpiresAt,
  });

  if (rotated) {
    const [user] = await db.select().from(users).where(eq(users.id, rotated.userId)).limit(1);
    return user ? {
      status: "rotated",
      sessionId: rotated.sessionId,
      absoluteExpiresAt: rotated.absoluteExpiresAt,
      user,
    } : null;
  }

  const [grace] = await db.select({
    sessionId: authSessions.id,
    absoluteExpiresAt: authSessions.absoluteExpiresAt,
    user: users,
  }).from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(and(
      eq(authSessions.previousTokenHash, input.currentTokenHash),
      gt(authSessions.previousValidUntil, input.now),
      gt(authSessions.idleExpiresAt, input.now),
      gt(authSessions.absoluteExpiresAt, input.now),
    )).limit(1);

  return grace ? {
    status: "grace",
    sessionId: grace.sessionId,
    absoluteExpiresAt: grace.absoluteExpiresAt,
    user: grace.user,
  } : null;
}

export async function revokeAuthSession(tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(authSessions).where(or(
    eq(authSessions.tokenHash, tokenHash),
    eq(authSessions.previousTokenHash, tokenHash),
  ));
}

export async function updateUserProfile(userId: number, patch: { name?: string; phone?: string; address?: string }) {
  const db = await getDb();
  if (!db) return { success: true };
  await db.update(users).set(patch).where(eq(users.id, userId));
  return { success: true };
}

export async function listCatalogProducts() {
  const db = await getDb();
  if (!db) return DEFAULT_SEED_PRODUCTS.map((product) => ({ ...product, stock: 0, stockStatus: "Out of stock" }));
  const rows = await db.select().from(products).where(and(eq(products.hidden, 0), eq(products.active, 1))).orderBy(desc(products.createdAt));
  return rows;
}

export async function listAdminCatalogProducts() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(products).orderBy(desc(products.createdAt));
}

export function toPublicCatalogProduct<T extends { stock: number; lowStockThreshold: number; stockStatus: string }>(product: T) {
  const { stock, lowStockThreshold, ...publicProduct } = product;
  // stockStatus is stored alongside the inventory count, so it can become stale
  // after a stock adjustment. Derive the public status from the current count.
  const stockStatus = stock <= 0
    ? "Out of stock"
    : stock <= lowStockThreshold
      ? "Limited"
      : "In stock";
  return { ...publicProduct, stockStatus };
}

export async function searchCatalogProducts(query: string) {
  const db = await getDb();
  const term = query.trim().toLowerCase();
  if (!db) {
    return DEFAULT_SEED_PRODUCTS.map((product) => ({ ...product, stock: 0, stockStatus: "Out of stock" })).filter((p) =>
      `${p.name} ${p.sku} ${p.category} ${p.tags} ${p.shortDescription}`.toLowerCase().includes(term)
    );
  }
  const sqlTerm = `%${term}%`;
  const results = await db.select().from(products).where(and(eq(products.hidden, 0), eq(products.active, 1), or(ilike(products.name, sqlTerm), ilike(products.sku, sqlTerm), ilike(products.shortDescription, sqlTerm), ilike(products.description, sqlTerm), ilike(products.category, sqlTerm), ilike(products.tags, sqlTerm), ilike(products.specs, sqlTerm)))).orderBy(desc(products.createdAt));
  return results;
}

export async function getCatalogProduct(slugOrId: string) {
  const cleanSlug = slugOrId.trim().toLowerCase();
  const db = await getDb();
  if (db) {
    const result = await db.select().from(products).where(and(or(eq(products.slug, cleanSlug), eq(products.sku, cleanSlug.toUpperCase())), eq(products.hidden, 0), eq(products.active, 1))).limit(1);
    return result[0];
  }
  // Fallback to seed catalog
  const found = DEFAULT_SEED_PRODUCTS.find(
    (p) => p.slug.toLowerCase() === cleanSlug || p.sku.toLowerCase() === cleanSlug || String(p.id) === cleanSlug
  );
  return found ? { ...found, stock: 0, stockStatus: "Out of stock" } : undefined;
}
export async function createCatalogProduct(product: InsertProduct, adminUserId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const generated = product.sku?.trim() || `HD-${String(product.category || "PRT").replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "PRT"}-${String(product.name).replace(/[^a-z0-9]/gi, "").slice(0, 12).toUpperCase() || "NEW"}`;
  const existingSkus = new Set((await db.select({ sku: products.sku }).from(products)).map(row => row.sku?.toUpperCase()).filter(Boolean));
  let sku = generated.toUpperCase();
  let suffix = 2;
  while (existingSkus.has(sku)) sku = `${generated.toUpperCase()}-${String(suffix++).padStart(3, "0")}`;
  const stock = product.stock ?? 0;
  const lowStockThreshold = product.lowStockThreshold ?? 5;
  const stockStatus = stock <= 0 ? "Out of stock" : stock <= lowStockThreshold ? "Limited" : "In stock";
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(products).values({ ...product, sku, stock, lowStockThreshold, stockStatus }).returning({ id: products.id });
    if (!created) throw new Error("Product could not be created");
    if (stock > 0) {
      await tx.insert(inventoryMovements).values({ productId: created.id, change: stock, reason: "INITIAL_STOCK", note: "Initial stock recorded when product was created", createdBy: adminUserId });
    }
    await tx.insert(auditLogs).values({ adminUserId, action: "PRODUCT_CREATED", entityType: "product", entityId: created.id, details: JSON.stringify({ stock, lowStockThreshold, stockStatus }) });
    return { success: true, id: created.id };
  });
}
export async function updateCatalogProduct(id: number, product: Partial<InsertProduct>, adminUserId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const [current] = await tx.select({ name: products.name, stock: products.stock, lowStockThreshold: products.lowStockThreshold })
      .from(products).where(eq(products.id, id)).limit(1).for("update");
    if (!current) throw new Error("Product not found");

    const nextStock = product.stock ?? current.stock;
    const nextThreshold = product.lowStockThreshold ?? current.lowStockThreshold;
    const stockStatus = nextStock <= 0
      ? "Out of stock"
      : nextStock <= nextThreshold
        ? "Limited"
        : "In stock";
    const [updated] = await tx.update(products)
      .set({ ...product, stockStatus })
      .where(eq(products.id, id))
      .returning({ id: products.id });
    if (!updated) throw new Error("Product not found");

    const stockChange = nextStock - current.stock;
    if (stockChange !== 0) {
      await tx.insert(inventoryMovements).values({
        productId: id,
        change: stockChange,
        reason: "ADJUSTMENT",
        note: `Stock count adjusted from ${current.stock} to ${nextStock}`,
        createdBy: adminUserId,
      });
    }
    await tx.insert(auditLogs).values({
      adminUserId,
      action: stockChange ? "PRODUCT_AND_INVENTORY_UPDATED" : "PRODUCT_UPDATED",
      entityType: "product",
      entityId: id,
      details: JSON.stringify({ stockChange, stock: nextStock, lowStockThreshold: nextThreshold }),
    });
    return updated;
  });
}
export async function deleteCatalogProduct(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.update(products).set({ hidden: 1 }).where(eq(products.id, id));
}

export async function listProductCategories() {
  const db = await getDb();
  if (!db) return defaultProductCategories.map((name, index) => ({
    id: index + 1,
    name,
    productCount: DEFAULT_SEED_PRODUCTS.filter((product) => product.category === name).length,
  }));
  const [categories, usage] = await Promise.all([
    db.select({ id: productCategories.id, name: productCategories.name })
      .from(productCategories)
      .orderBy(asc(productCategories.name)),
    db.select({ name: products.category, count: sql<number>`count(*)::int` })
      .from(products)
      .groupBy(products.category),
  ]);
  const productCounts = new Map(usage.map((row) => [row.name, row.count]));
  return categories.map((category) => ({
    ...category,
    productCount: productCounts.get(category.name) ?? 0,
  }));
}

export async function createProductCategory(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const normalizedName = name.trim();
  const [existing] = await db.select({ id: productCategories.id })
    .from(productCategories)
    .where(sql`lower(${productCategories.name}) = lower(${normalizedName})`)
    .limit(1);
  if (existing) return false;
  await db.insert(productCategories).values({ name: normalizedName });
  return true;
}

export async function deleteProductCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [category] = await db.select({ name: productCategories.name })
    .from(productCategories)
    .where(eq(productCategories.id, id))
    .limit(1);
  if (!category) return { deleted: false, inUse: false };
  const [assignedProduct] = await db.select({ id: products.id })
    .from(products)
    .where(eq(products.category, category.name))
    .limit(1);
  if (assignedProduct) return { deleted: false, inUse: true };
  await db.delete(productCategories).where(eq(productCategories.id, id));
  return { deleted: true, inUse: false };
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

type RequestedItem = { slug: string; quantity: number };

const toPaise = (amount: number) => Math.round((amount + Number.EPSILON) * 100);
const fromPaise = (paise: number) => paise / 100;

function orderCode(year: number, id: number) {
  return `HAI-${year}-${String(id).padStart(6, "0")}`;
}

export async function createServerPricedOrder(input: { userId?: number; customerName: string; phone: string; address: string; items: RequestedItem[] }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!input.items.length) throw new Error("Your cart is empty");
  // Resolve cart lines against the same active catalog used by browse/search.
  // Map normalized slugs so browser casing or old localStorage values cannot
  // turn a live item into a false "Product unavailable" result.
  const catalogRows = await db.select().from(products).where(and(eq(products.hidden, 0), eq(products.active, 1)));
  const bySlug = new Map(catalogRows.map((product) => [product.slug.trim().toLowerCase(), product]));
  const lineItems = input.items.map((item) => {
    const normalizedSlug = item.slug.trim().toLowerCase();
    const product = bySlug.get(normalizedSlug);
    if (!product) throw new Error(`Product unavailable: ${item.slug}`);
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error("Invalid product quantity");
    if (product.stock <= 0) throw new Error(`${product.name} is out of stock.`);
    if (item.quantity > product.stock) throw new Error(`Only ${product.stock} ${product.name} available.`);
    return { product, quantity: item.quantity, lineTotal: fromPaise(toPaise(product.price) * item.quantity) };
  });
  const subtotal = fromPaise(lineItems.reduce((sum, item) => sum + toPaise(item.lineTotal), 0));
  const settings = await db.select().from(siteSettings).limit(1);
  const shipping = settings[0]?.shippingFee ?? 50;
  const calculatedAmount = fromPaise(toPaise(subtotal) + toPaise(shipping));
  return db.transaction(async (tx) => {
    const [inserted] = await tx.insert(orders).values({ userId: input.userId, customerName: input.customerName, phone: input.phone, address: input.address, items: JSON.stringify(lineItems.map(({ product, quantity }) => ({ slug: product.slug, name: product.name, sku: product.sku, quantity, unitPrice: product.price }))), subtotal, shipping, calculatedAmount, finalAmount: calculatedAmount, total: calculatedAmount, status: "ORDER_REQUESTED", paymentStatus: "PENDING" }).returning({ id: orders.id });
    const orderId = inserted.id;
    const number = orderCode(new Date().getFullYear(), orderId);
    await tx.update(orders).set({ orderNumber: number }).where(eq(orders.id, orderId));
    await tx.insert(orderItems).values(lineItems.map(({ product, quantity, lineTotal }) => ({ orderId, productId: product.id, productName: product.name, sku: product.sku, quantity, unitPrice: product.price, lineTotal })));
    await tx.insert(payments).values({ orderId, amount: calculatedAmount, status: "PENDING" });
    await tx.insert(auditLogs).values({ action: "ORDER_REQUESTED", entityType: "order", entityId: orderId, details: JSON.stringify({ source: "whatsapp_checkout", userId: input.userId, amount: calculatedAmount }) });
    return { id: orderId, orderNumber: number, subtotal, shipping, total: calculatedAmount, status: "ORDER_REQUESTED" };
  });
}
export async function listOrdersForUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  // Account history only needs customer-facing order fields. Avoid selecting
  // admin-only invoice delivery metadata so existing orders remain readable
  // while a deployment is catching up with the newest invoice migration.
  return db.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    userId: orders.userId,
    customerName: orders.customerName,
    phone: orders.phone,
    address: orders.address,
    items: orders.items,
    subtotal: orders.subtotal,
    shipping: orders.shipping,
    calculatedAmount: orders.calculatedAmount,
    finalAmount: orders.finalAmount,
    total: orders.total,
    amountOverridden: orders.amountOverridden,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    invoiceId: orders.invoiceId,
    createdAt: orders.createdAt,
  }).from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderForUser(userId: number, id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.userId, userId))).limit(1);
  if (!result[0]) return undefined;
  return { ...result[0], items: await db.select().from(orderItems).where(eq(orderItems.orderId, id)) };
}

export async function listAdminOrders() {
  const db = await getDb(); if (!db) return [];
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  return Promise.all(rows.map(async (order) => {
    const normalized = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    if (normalized.length) return { ...order, items: normalized };
    try {
      const legacy = JSON.parse(order.items) as Array<{ id?: string; name?: string; sku?: string; quantity?: number; price?: number }>;
      return { ...order, items: legacy.map((item, index) => ({ id: -(index + 1), orderId: order.id, productId: 0, productName: item.name || "Legacy item", sku: item.sku, quantity: item.quantity || 1, unitPrice: item.price || 0, lineTotal: (item.price || 0) * (item.quantity || 1) })) };
    } catch { return { ...order, items: [] }; }
  }));
}

const orderTransitions: Record<string, string[]> = {
  ORDER_REQUESTED: ["PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_PENDING: ["ORDER_CONFIRMED", "PAYMENT_REJECTED", "CANCELLED"],
  ORDER_CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  PAYMENT_REJECTED: [],
  CANCELLED: [],
};

export async function transitionOrderStatus(id: number, status: string, adminUserId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.transaction(async (tx) => {
    const [current] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, id)).limit(1).for("update");
    if (!current) throw new Error("Order not found");
    if (!(orderTransitions[current.status] || []).includes(status)) throw new Error(`Cannot move ${current.status} to ${status}`);
    const [updated] = await tx.update(orders)
      .set({ status })
      .where(and(eq(orders.id, id), eq(orders.status, current.status)))
      .returning({ id: orders.id });
    if (!updated) throw new Error("Order status changed while this update was being saved. Refresh and try again.");
    await tx.insert(auditLogs).values({ adminUserId, action: `ORDER_${status}`, entityType: "order", entityId: id, details: JSON.stringify({ from: current.status, to: status }) });
  });
  return { success: true, status };
}

export async function verifyOrderPayment(id: number, adminUserId: number, reference?: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const orderRows = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
    const order = orderRows[0];
    if (!order) throw new Error("Order not found");
    if (order.status !== "PAYMENT_PENDING") throw new Error("Order must be in PAYMENT_PENDING before payment verification");
    const invoiceId = `INV-${new Date().getFullYear()}-${String(order.id).padStart(6, "0")}`;
    const [verifiedOrder] = await tx.update(orders)
      .set({ status: "ORDER_CONFIRMED", paymentStatus: "VERIFIED", invoiceId, invoiceEmailStatus: "PENDING", invoiceEmailError: null })
      .where(and(eq(orders.id, id), eq(orders.status, "PAYMENT_PENDING")))
      .returning({ id: orders.id });
    if (!verifiedOrder) throw new Error("Order payment is already being processed");
    const lines = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
    if (!lines.length) throw new Error("This legacy order needs product lines re-created before payment can be verified");
    for (const line of lines) {
      const [updatedProduct] = await tx.update(products).set({
        stock: sql`${products.stock} - ${line.quantity}`,
        stockStatus: sql`CASE
          WHEN ${products.stock} - ${line.quantity} <= 0 THEN 'Out of stock'
          WHEN ${products.stock} - ${line.quantity} <= ${products.lowStockThreshold} THEN 'Limited'
          ELSE 'In stock'
        END`,
      }).where(and(eq(products.id, line.productId), gte(products.stock, line.quantity), eq(products.active, 1))).returning({ id: products.id });
      if (!updatedProduct) throw new Error(`Insufficient stock for ${line.productName}`);
      await tx.insert(inventoryMovements).values({ productId: line.productId, change: -line.quantity, reason: "SALE", orderId: id, createdBy: adminUserId });
    }
    await tx.update(payments).set({ status: "VERIFIED", amount: order.finalAmount, reference, verifiedBy: adminUserId, verifiedAt: new Date() }).where(eq(payments.orderId, id));
    await tx.insert(transactions).values({ orderId: id, amount: order.finalAmount, type: "SALE", paymentStatus: "VERIFIED", createdBy: adminUserId });
    await tx.insert(auditLogs).values({ adminUserId, action: "PAYMENT_VERIFIED", entityType: "order", entityId: id, details: JSON.stringify({ amount: order.finalAmount, reference }) });
    await tx.insert(auditLogs).values({ adminUserId, action: "INVOICE_GENERATED", entityType: "order", entityId: id, details: JSON.stringify({ invoiceId, amount: order.finalAmount, trigger: "PAYMENT_VERIFIED" }) });
    return { success: true, status: "ORDER_CONFIRMED", orderNumber: order.orderNumber, invoiceId };
  });
}

export async function emailVerifiedOrderInvoice(id: number, adminUserId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  const order = result[0];
  if (!order) throw new Error("Order not found");
  if (order.paymentStatus !== "VERIFIED" || !order.invoiceId) throw new Error("Verify payment before emailing the invoice");

  const customer = order.userId
    ? (await db.select({ email: users.email }).from(users).where(eq(users.id, order.userId)).limit(1))[0]
    : undefined;
  if (!customer?.email) {
    const error = "Customer account has no email address. Add an email address before sending the invoice.";
    await db.transaction(async (tx) => {
      await tx.update(orders).set({ invoiceEmailStatus: "FAILED", invoiceEmailError: error }).where(eq(orders.id, id));
      await tx.insert(auditLogs).values({ adminUserId, action: "INVOICE_EMAIL_FAILED", entityType: "order", entityId: id, details: error });
    });
    return { sent: false, error };
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  try {
    await sendInvoiceEmail(customer.email, {
      invoiceId: order.invoiceId,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      customerName: order.customerName,
      address: order.address,
      phone: order.phone,
      subtotal: order.subtotal,
      shipping: order.shipping,
      finalAmount: order.finalAmount,
      items,
    });
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "Invoice email could not be sent.";
    await db.transaction(async (tx) => {
      await tx.update(orders).set({ invoiceEmailStatus: "FAILED", invoiceEmailError: error }).where(eq(orders.id, id));
      await tx.insert(auditLogs).values({ adminUserId, action: "INVOICE_EMAIL_FAILED", entityType: "order", entityId: id, details: error.slice(0, 1000) });
    });
    return { sent: false, error };
  }

  await db.transaction(async (tx) => {
    await tx.update(orders).set({ invoiceEmailStatus: "SENT", invoiceEmailSentAt: new Date(), invoiceEmailError: null }).where(eq(orders.id, id));
    await tx.insert(auditLogs).values({ adminUserId, action: "INVOICE_EMAIL_SENT", entityType: "order", entityId: id, details: JSON.stringify({ invoiceId: order.invoiceId, recipient: customer.email }) });
  });
  return { sent: true, recipient: customer.email };
}

export async function rejectOrderPayment(id: number, adminUserId: number, note?: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!result[0] || result[0].status !== "PAYMENT_PENDING") throw new Error("Order is not awaiting payment");
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status: "PAYMENT_REJECTED", paymentStatus: "REJECTED" }).where(eq(orders.id, id));
    await tx.update(payments).set({ status: "REJECTED" }).where(eq(payments.orderId, id));
    await tx.insert(auditLogs).values({ adminUserId, action: "PAYMENT_REJECTED", entityType: "order", entityId: id, details: note || "Payment rejected" });
  });
  return { success: true };
}

export async function overrideOrderAmount(id: number, finalAmount: number, adminUserId: number, reason?: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  const order = result[0];
  if (!order) throw new Error("Order not found");
  if (order.status === "DELIVERED" || order.status === "CANCELLED") throw new Error("Cannot override amount for closed orders");
  
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ finalAmount, total: finalAmount, amountOverridden: 1 }).where(eq(orders.id, id));
    await tx.update(payments).set({ amount: finalAmount }).where(eq(payments.orderId, id));
    await tx.insert(auditLogs).values({
      adminUserId,
      action: "AMOUNT_OVERRIDE",
      entityType: "order",
      entityId: id,
      details: JSON.stringify({ oldAmount: order.finalAmount, newAmount: finalAmount, calculatedAmount: order.calculatedAmount, reason }),
    });
  });
  return { success: true, finalAmount };
}

export async function generateOrderInvoice(id: number, adminUserId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  const order = result[0];
  if (!order) throw new Error("Order not found");
  if (order.paymentStatus !== "VERIFIED") throw new Error("Invoice can only be generated after payment is verified");

  // Idempotent: If invoice already generated, return existing
  if (order.invoiceId) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return { success: true, invoiceId: order.invoiceId, order, items, alreadyExists: true };
  }

  const invoiceId = `INV-${new Date().getFullYear()}-${String(order.id).padStart(6, "0")}`;
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ invoiceId }).where(eq(orders.id, id));
    await tx.insert(auditLogs).values({
      adminUserId,
      action: "INVOICE_GENERATED",
      entityType: "order",
      entityId: id,
      details: JSON.stringify({ invoiceId, amount: order.finalAmount }),
    });
  });

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { success: true, invoiceId, order: { ...order, invoiceId }, items, alreadyExists: false };
}

export async function restockProduct(productId: number, amount: number, adminUserId: number, note?: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Restock amount must be positive");
  await db.transaction(async (tx) => {
    const updated = await tx.update(products).set({
      stock: sql`${products.stock} + ${amount}`,
      stockStatus: sql`CASE
        WHEN ${products.stock} + ${amount} <= 0 THEN 'Out of stock'
        WHEN ${products.stock} + ${amount} <= ${products.lowStockThreshold} THEN 'Limited'
        ELSE 'In stock'
      END`,
    }).where(eq(products.id, productId)).returning({ id: products.id, stock: products.stock, lowStockThreshold: products.lowStockThreshold });
    if (!updated.length) throw new Error("Product not found; inventory was not changed.");
    await tx.insert(inventoryMovements).values({ productId, change: amount, reason: "RESTOCK", note, createdBy: adminUserId });
    await tx.insert(auditLogs).values({ adminUserId, action: "INVENTORY_RESTOCK", entityType: "product", entityId: productId, details: JSON.stringify({ amount, note }) });
  });
  return { success: true };
}

export async function listInventoryMovements() {
  const db = await getDb(); if (!db) return [];
  return db.select({ movement: inventoryMovements, productName: products.name, sku: products.sku }).from(inventoryMovements).leftJoin(products, eq(inventoryMovements.productId, products.id)).orderBy(desc(inventoryMovements.createdAt)).limit(300);
}

export async function listTransactions() {
  const db = await getDb(); if (!db) return [];
  return db.select({ transaction: transactions, orderNumber: orders.orderNumber }).from(transactions).leftJoin(orders, eq(transactions.orderId, orders.id)).orderBy(desc(transactions.createdAt)).limit(300);
}

export async function listAuditLogs() {
  const db = await getDb(); if (!db) return [];
  return db.select({ log: auditLogs, adminName: users.name }).from(auditLogs).leftJoin(users, eq(auditLogs.adminUserId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(300);
}

export async function getCommerceMetrics() {
  const db = await getDb(); if (!db) return { orders: 0, pendingPayments: 0, lowStock: 0, todaySales: 0, revenue: 0 };
  const indiaDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [year, month, day] = indiaDate.split("-").map(Number);
  const todayStart = new Date(Date.UTC(year, month - 1, day) - 330 * 60 * 1000);
  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [pending] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "PAYMENT_PENDING"));
  const [lowStock] = await db.select({ count: sql<number>`count(*)` }).from(products).where(and(eq(products.active, 1), sql`${products.stock} <= ${products.lowStockThreshold}`));
  const [sales] = await db.select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` }).from(transactions).where(eq(transactions.paymentStatus, "VERIFIED"));
  const [todaySales] = await db.select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` }).from(transactions).where(and(eq(transactions.paymentStatus, "VERIFIED"), gte(transactions.createdAt, todayStart)));
  return { orders: Number(orderCount?.count || 0), pendingPayments: Number(pending?.count || 0), lowStock: Number(lowStock?.count || 0), todaySales: Number(todaySales?.total || 0), revenue: Number(sales?.total || 0) };
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
  return db.insert(newsletterSubscribers).values({ email }).onConflictDoNothing({ target: newsletterSubscribers.email });
}
export async function recordAnalyticsEvent(input: typeof analyticsEvents.$inferInsert) {
  const db = await getDb(); if (!db) return;
  return db.insert(analyticsEvents).values(input);
}
export async function getSiteSettings() {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(siteSettings).limit(1);
  return result[0] ?? null;
}

export async function saveSiteSettings(input: Partial<typeof siteSettings.$inferInsert>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.insert(siteSettings).values({ id: 1, ...input }).onConflictDoUpdate({
    target: siteSettings.id,
    set: { ...input, updatedAt: new Date() },
  });
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
  const [created] = await db.insert(comboKits).values({ slug: input.slug, name: input.name, tagline: input.tagline, description: input.description, price: input.price, featured: input.featured ?? 0 }).returning({ id: comboKits.id });
  if (input.items.length) await db.insert(comboKitItems).values(input.items.map((item) => ({ comboKitId: created.id, productSlug: item.productSlug, quantity: item.quantity })));
}

export async function hideComboKit(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.update(comboKits).set({ hidden: 1 }).where(eq(comboKits.id, id));
}

export async function createComboKitRequest(input: { comboKitId: number; userId?: number; customerName: string; phone: string; address: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const [kit] = await db.select({ id: comboKits.id }).from(comboKits).where(and(eq(comboKits.id, input.comboKitId), eq(comboKits.hidden, 0))).limit(1);
  if (!kit) throw new Error("This combo kit is no longer available.");
  const [request] = await db.insert(comboKitRequests).values(input).returning({ id: comboKitRequests.id });
  return { success: true, requestId: request.id };
}

export async function listComboKitRequests() {
  const db = await getDb(); if (!db) return [];
  return db.select({ request: comboKitRequests, kit: comboKits.name, kitSlug: comboKits.slug })
    .from(comboKitRequests).leftJoin(comboKits, eq(comboKitRequests.comboKitId, comboKits.id))
    .orderBy(desc(comboKitRequests.createdAt)).limit(300);
}

export async function approveComboKitRequest(id: number, adminUserId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const [request] = await db.select().from(comboKitRequests).where(eq(comboKitRequests.id, id)).limit(1);
  if (!request) throw new Error("Combo kit request not found.");
  if (request.status !== "REQUESTED") throw new Error("This request has already been processed.");
  const [claimed] = await db.update(comboKitRequests).set({ status: "PROCESSING" }).where(and(eq(comboKitRequests.id, id), eq(comboKitRequests.status, "REQUESTED"))).returning({ id: comboKitRequests.id });
  if (!claimed) throw new Error("This request is already being processed.");
  try {
    const [kit] = await db.select().from(comboKits).where(eq(comboKits.id, request.comboKitId)).limit(1);
    if (!kit) throw new Error("Combo kit not found.");
    const items = await db.select().from(comboKitItems).where(eq(comboKitItems.comboKitId, kit.id));
    if (!items.length) throw new Error("This combo kit has no components.");
    const order = await createServerPricedOrder({ userId: request.userId ?? undefined, customerName: request.customerName, phone: request.phone, address: request.address, items: items.map(item => ({ slug: item.productSlug, quantity: item.quantity })) });
    await db.update(comboKitRequests).set({ status: "ORDER_CREATED", approvedOrderId: order.id }).where(eq(comboKitRequests.id, id));
    await db.insert(auditLogs).values({ adminUserId, action: "COMBO_REQUEST_APPROVED", entityType: "combo_request", entityId: id, details: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber }) });
    return { ...order, requestId: id };
  } catch (error) {
    await db.update(comboKitRequests).set({ status: "REQUESTED" }).where(and(eq(comboKitRequests.id, id), eq(comboKitRequests.status, "PROCESSING")));
    throw error;
  }
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

export async function listStoreUpdates(activeOnly = true) {
  const db = await getDb(); if (!db) return [];
  const where = activeOnly ? eq(storeUpdates.active, 1) : undefined;
  return db.select().from(storeUpdates).where(where).orderBy(desc(storeUpdates.createdAt)).limit(activeOnly ? 24 : 100);
}

export async function createStoreUpdate(input: InsertStoreUpdate, adminUserId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(storeUpdates).values(input).returning({ id: storeUpdates.id });
    await tx.insert(auditLogs).values({
      adminUserId,
      action: "STORE_UPDATE_CREATED",
      entityType: "store_update",
      entityId: created.id,
      details: JSON.stringify({ kind: input.kind, title: input.title }),
    });
    return { success: true, id: created.id };
  });
}

export async function hideStoreUpdate(id: number, adminUserId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const [updated] = await tx.update(storeUpdates).set({ active: 0 })
      .where(and(eq(storeUpdates.id, id), eq(storeUpdates.active, 1)))
      .returning({ id: storeUpdates.id, title: storeUpdates.title });
    if (!updated) throw new Error("Update not found or already hidden");
    await tx.insert(auditLogs).values({
      adminUserId,
      action: "STORE_UPDATE_HIDDEN",
      entityType: "store_update",
      entityId: updated.id,
      details: JSON.stringify({ title: updated.title }),
    });
    return { success: true };
  });
}
