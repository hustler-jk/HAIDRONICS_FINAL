import { and, desc, eq, gte, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { analyticsEvents, auditLogs, comboKitItems, comboKits, customerStories, InsertProduct, inventoryMovements, newsletterSubscribers, orderItems, orders, payments, products, productRequests, projectRequests, siteSettings, InsertUser, transactions, users } from "../drizzle/schema";
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
  return db.select().from(products).where(and(eq(products.hidden, 0), eq(products.active, 1))).orderBy(desc(products.createdAt));
}

export async function searchCatalogProducts(query: string) {
  const db = await getDb(); if (!db) return [];
  const term = `%${query.trim()}%`;
  return db.select().from(products).where(and(eq(products.hidden, 0), eq(products.active, 1), or(like(products.name, term), like(products.sku, term), like(products.shortDescription, term), like(products.description, term), like(products.category, term), like(products.tags, term), like(products.specs, term)))).orderBy(desc(products.createdAt));
}
export async function getCatalogProduct(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(products).where(and(eq(products.slug, slug), eq(products.hidden, 0), eq(products.active, 1))).limit(1);
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

type RequestedItem = { slug: string; quantity: number };

function orderCode(year: number, id: number) {
  return `HAI-${year}-${String(id).padStart(6, "0")}`;
}

export async function createServerPricedOrder(input: { userId?: number; customerName: string; phone: string; address: string; items: RequestedItem[] }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!input.items.length) throw new Error("Your cart is empty");
  const slugs = Array.from(new Set(input.items.map((item) => item.slug)));
  const catalogRows = await db.select().from(products).where(and(or(...slugs.map((slug) => eq(products.slug, slug))), eq(products.hidden, 0), eq(products.active, 1)));
  const bySlug = new Map(catalogRows.map((product) => [product.slug, product]));
  const lineItems = input.items.map((item) => {
    const product = bySlug.get(item.slug);
    if (!product) throw new Error(`Product unavailable: ${item.slug}`);
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error("Invalid product quantity");
    return { product, quantity: item.quantity, lineTotal: product.price * item.quantity };
  });
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const settings = await db.select().from(siteSettings).limit(1);
  const shipping = settings[0]?.shippingFee ?? 50;
  const calculatedAmount = subtotal + shipping;
  return db.transaction(async (tx) => {
    const inserted = await tx.insert(orders).values({ userId: input.userId, customerName: input.customerName, phone: input.phone, address: input.address, items: JSON.stringify(lineItems.map(({ product, quantity }) => ({ slug: product.slug, name: product.name, sku: product.sku, quantity, unitPrice: product.price }))), subtotal, shipping, calculatedAmount, finalAmount: calculatedAmount, total: calculatedAmount, status: "ORDER_REQUESTED", paymentStatus: "PENDING" });
    const orderId = Number((inserted as any).insertId ?? (inserted as any)[0]?.insertId);
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
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
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
  const current = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!current[0]) throw new Error("Order not found");
  if (!(orderTransitions[current[0].status] || []).includes(status)) throw new Error(`Cannot move ${current[0].status} to ${status}`);
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status }).where(and(eq(orders.id, id), eq(orders.status, current[0].status)));
    await tx.insert(auditLogs).values({ adminUserId, action: `ORDER_${status}`, entityType: "order", entityId: id, details: JSON.stringify({ from: current[0].status, to: status }) });
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
    const lines = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
    if (!lines.length) throw new Error("This legacy order needs product lines re-created before payment can be verified");
    for (const line of lines) {
      const update = await tx.update(products).set({ stock: sql`${products.stock} - ${line.quantity}` }).where(and(eq(products.id, line.productId), gte(products.stock, line.quantity), eq(products.active, 1)));
      const affected = Number((update as any)[0]?.affectedRows ?? (update as any).affectedRows ?? 0);
      if (affected !== 1) throw new Error(`Insufficient stock for ${line.productName}`);
      await tx.insert(inventoryMovements).values({ productId: line.productId, change: -line.quantity, reason: "SALE", orderId: id, createdBy: adminUserId });
    }
    await tx.update(orders).set({ status: "ORDER_CONFIRMED", paymentStatus: "VERIFIED" }).where(and(eq(orders.id, id), eq(orders.status, "PAYMENT_PENDING")));
    await tx.update(payments).set({ status: "VERIFIED", amount: order.finalAmount, reference, verifiedBy: adminUserId, verifiedAt: new Date() }).where(eq(payments.orderId, id));
    await tx.insert(transactions).values({ orderId: id, amount: order.finalAmount, type: "SALE", paymentStatus: "VERIFIED", createdBy: adminUserId });
    await tx.insert(auditLogs).values({ adminUserId, action: "PAYMENT_VERIFIED", entityType: "order", entityId: id, details: JSON.stringify({ amount: order.finalAmount, reference }) });
    return { success: true, status: "ORDER_CONFIRMED", orderNumber: order.orderNumber };
  });
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

export async function restockProduct(productId: number, amount: number, adminUserId: number, note?: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Restock amount must be positive");
  await db.transaction(async (tx) => {
    await tx.update(products).set({ stock: sql`${products.stock} + ${amount}` }).where(eq(products.id, productId));
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
  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [pending] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "PAYMENT_PENDING"));
  const [lowStock] = await db.select({ count: sql<number>`count(*)` }).from(products).where(and(eq(products.active, 1), sql`${products.stock} <= ${products.lowStockThreshold}`));
  const [sales] = await db.select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` }).from(transactions).where(eq(transactions.paymentStatus, "VERIFIED"));
  return { orders: Number(orderCount?.count || 0), pendingPayments: Number(pending?.count || 0), lowStock: Number(lowStock?.count || 0), todaySales: Number(sales?.total || 0), revenue: Number(sales?.total || 0) };
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
