import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { clearSessionCookies, issueSessionCookies } from "./auth/session";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { approveComboKitRequest, createCatalogProduct, createComboKit, createComboKitRequest, createCustomerStory, createProductCategory, createServerPricedOrder, createStoreUpdate, deleteCatalogProduct, deleteProductCategory, emailVerifiedOrderInvoice, generateOrderInvoice, getCatalogProduct, getCommerceMetrics, getDb, getOrderForUser, getSiteSettings, getUserByEmail, hideComboKit, hideCustomerStory, hideStoreUpdate, listAdminCatalogProducts, listAdminOrders, listAnalyticsEvents, listAuditLogs, listCatalogProducts, listComboKitRequests, listComboKits, listCustomerStories, listInventoryMovements, listOrdersForUser, listProductCategories, listProductRequests, listProjectRequests, listRequestsForUser, listStoreUpdates, listTransactions, overrideOrderAmount, recordAnalyticsEvent, rejectOrderPayment, restockProduct, saveEmailVerificationToken, saveProductRequest, saveProjectRequest, saveSiteSettings, searchCatalogProducts, subscribeNewsletter, toPublicCatalogProduct, transitionOrderStatus, updateCatalogProduct, updateUserProfile, upsertUser, verifyEmailToken, verifyOrderPayment } from "./db";
import { storagePut } from "./storage";
import { hashPassword, verifyPassword } from "./auth/password";
import { createHash, randomBytes } from "node:crypto";
import { isEmailVerificationConfigured, sendEmailVerification } from "./auth/email-verification";

const moneyInput = z.number().finite().nonnegative().refine(
  (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7,
  "Amount must have no more than two decimal places.",
);

const productInput = z.object({
  slug: z.string().min(1).max(180), name: z.string().min(1).max(180), sku: z.string().max(80).optional(), price: moneyInput, shortDescription: z.string().optional(), description: z.string().optional(), category: z.string().max(80).optional(), tags: z.string().optional(), specs: z.string().optional(), imageUrl: z.string().nullable().optional(), images: z.array(z.string().max(2000)).max(4).optional(), stockStatus: z.enum(["In stock", "Limited", "Out of stock"]).optional(), stock: z.number().int().nonnegative().optional(), lowStockThreshold: z.number().int().nonnegative().optional(), active: z.number().int().min(0).max(1).optional(), hidden: z.number().int().min(0).max(1).optional(), featured: z.number().int().min(0).max(1).optional(),
});

export const appRouter = router({
  system: router({}),
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      const user = ctx.user;
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
        lastSignedIn: user.lastSignedIn,
      };
    }),
    register: publicProcedure
      .input(z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6), phone: z.string().optional(), address: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!isEmailVerificationConfigured()) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Email verification is not configured. Set RESEND_API_KEY and INVOICE_FROM_EMAIL to a verified sender." });
        }
        if (!(await getDb())) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Account services are unavailable. Please try again later." });
        const email = input.email.trim().toLowerCase();
        const existing = await getUserByEmail(email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
        const openId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await upsertUser({
          openId,
          name: input.name.trim(),
          email,
          password: await hashPassword(input.password),
          phone: input.phone || null,
          address: input.address || null,
          loginMethod: "password",
          role: "user",
          lastSignedIn: new Date(),
        });
        const registeredUser = await getUserByEmail(email);
        if (!registeredUser) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load the new account." });
        const token = randomBytes(32).toString("base64url");
        await saveEmailVerificationToken(registeredUser.id, createHash("sha256").update(token).digest("hex"), new Date(Date.now() + 30 * 60 * 1000));
        const origin = `${ctx.req.protocol}://${ctx.req.get("host") || "localhost"}`;
        await sendEmailVerification(email, input.name.trim(), token, origin);
        return { success: true, verificationRequired: true };
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!(await getDb())) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Account services are unavailable. Please try again later." });
        const user = await getUserByEmail(input.email.trim().toLowerCase());
        if (!user || !user.password || !(await verifyPassword(input.password, user.password))) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
        }
        if (!user.emailVerifiedAt) throw new TRPCError({ code: "FORBIDDEN", message: "Please verify your email before signing in. You can request a new verification email below." });
        await upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
          ...(user.password.startsWith("$scrypt$") ? {} : { password: await hashPassword(input.password) }),
        });
        await issueSessionCookies(ctx.req, ctx.res, user);
        return { success: true, role: user.role };
      }),
    verifyEmail: publicProcedure.input(z.object({ token: z.string().min(20).max(200) })).mutation(async ({ input }) => {
      const valid = await verifyEmailToken(createHash("sha256").update(input.token).digest("hex"));
      if (!valid) throw new TRPCError({ code: "BAD_REQUEST", message: "This verification link is invalid or expired. Request a new one." });
      return { success: true };
    }),
    resendVerification: publicProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ input, ctx }) => {
      if (!isEmailVerificationConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Email verification is not configured. Please contact the store administrator." });
      }
      const user = await getUserByEmail(input.email.trim().toLowerCase());
      if (user && !user.emailVerifiedAt && user.password) {
        const token = randomBytes(32).toString("base64url");
        await saveEmailVerificationToken(user.id, createHash("sha256").update(token).digest("hex"), new Date(Date.now() + 30 * 60 * 1000));
        const origin = `${ctx.req.protocol}://${ctx.req.get("host") || "localhost"}`;
        await sendEmailVerification(user.email!, user.name || "there", token, origin);
      }
      return { success: true };
    }),
    updateProfile: protectedProcedure
      .input(z.object({ name: z.string().min(2).optional(), phone: z.string().optional(), address: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await clearSessionCookies(ctx.req, ctx.res);
      return { success: true } as const;
    }),
  }),
  catalog: router({
    list: publicProcedure.query(async () => (await listCatalogProducts()).map(toPublicCatalogProduct)),
    search: publicProcedure.input(z.object({ query: z.string().max(180) })).query(async ({ input }) => (await (input.query.trim() ? searchCatalogProducts(input.query) : listCatalogProducts())).map(toPublicCatalogProduct)),
    get: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const product = await getCatalogProduct(input.slug);
      return product ? toPublicCatalogProduct(product) : null;
    }),
    comboKits: publicProcedure.query(() => listComboKits()),
    customerStories: publicProcedure.query(() => listCustomerStories()),
    updates: publicProcedure.query(() => listStoreUpdates()),
    settings: publicProcedure.query(() => getSiteSettings()),
  }),
  analytics: router({
    track: publicProcedure.input(z.object({ event: z.string().trim().min(1).max(80), productId: z.string().max(180).optional(), query: z.string().max(180).optional(), path: z.string().max(255).optional() })).mutation(({ input }) => recordAnalyticsEvent(input).then(() => ({ success: true }))),
  }),
  requests: router({
    project: protectedProcedure.input(z.object({ name: z.string().min(1), phone: z.string().min(1), projectName: z.string().optional(), building: z.string().optional(), components: z.string().optional(), budget: z.string().optional() })).mutation(({ input, ctx }) => saveProjectRequest({ ...input, userId: ctx.user.id }).then(() => ({ success: true }))),
    product: protectedProcedure.input(z.object({ component: z.string().min(1), quantity: z.number().int().positive().default(1), reference: z.string().optional(), notes: z.string().optional() })).mutation(({ input, ctx }) => saveProductRequest({ ...input, userId: ctx.user.id }).then(() => ({ success: true }))),
  }),
  newsletter: router({
    subscribe: protectedProcedure.input(z.object({ email: z.string().email() })).mutation(({ input }) => subscribeNewsletter(input.email).then(() => ({ success: true }))),
  }),
  checkout: router({
    create: protectedProcedure.input(z.object({ customerName: z.string().min(2), phone: z.string().min(7), address: z.string().min(8), items: z.array(z.object({ slug: z.string().min(1), quantity: z.number().int().positive().max(99) })).min(1) })).mutation(({ input, ctx }) => createServerPricedOrder({ ...input, userId: ctx.user.id })),
    requestComboKit: publicProcedure.input(z.object({ comboKitId: z.number().int().positive(), customerName: z.string().min(2), phone: z.string().min(7), address: z.string().min(8) })).mutation(({ input, ctx }) => createComboKitRequest({ ...input, userId: ctx.user?.id })),
  }),
  account: router({
    history: protectedProcedure.query(({ ctx }) => listRequestsForUser(ctx.user.id).then(async (requests) => ({ ...requests, orders: await listOrdersForUser(ctx.user.id) }))),
    order: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input, ctx }) => getOrderForUser(ctx.user.id, input.id)),
  }),
  admin: router({
    products: router({
      list: adminProcedure.query(() => listAdminCatalogProducts()),
      create: adminProcedure.input(productInput).mutation(({ input, ctx }) => {
        const { images, ...product } = input;
        return createCatalogProduct({
          ...product,
          images: images ? JSON.stringify(images) : undefined,
        }, ctx.user.id);
      }),
      update: adminProcedure.input(productInput.partial().extend({ id: z.number().int().positive() })).mutation(({ input, ctx }) => {
        const { id, images, ...product } = input;
        return updateCatalogProduct(id, {
          ...product,
          ...(images !== undefined ? { images: JSON.stringify(images) } : {}),
        }, ctx.user.id).then(() => ({ success: true }));
      }),
      uploadImage: adminProcedure.input(z.object({
        filename: z.string().min(1).max(240),
        contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
        base64: z.string().min(100).max(7_000_000),
      })).mutation(async ({ input }) => {
        const safeFilename = input.filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 120);
        const encoded = input.base64.replace(/^data:[^;]+;base64,/, "");
        const data = Buffer.from(encoded, "base64");
        if (!data.length || data.length > 5_000_000) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Each product photo must be smaller than 5 MB." });
        }
        return storagePut(`haidronics-products/${Date.now()}-${crypto.randomUUID()}-${safeFilename}`, data, input.contentType);
      }),
      hide: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteCatalogProduct(input.id).then(() => ({ success: true }))),
    }),
    categories: router({
      list: adminProcedure.query(() => listProductCategories()),
      create: adminProcedure.input(z.object({ name: z.string().trim().min(1).max(80) })).mutation(async ({ input }) => {
        if (!(await createProductCategory(input.name))) {
          throw new TRPCError({ code: "CONFLICT", message: "That product category already exists." });
        }
        return { success: true };
      }),
      delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
        const result = await deleteProductCategory(input.id);
        if (result.inUse) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Move the products out of this category before deleting it." });
        }
        if (!result.deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Product category not found." });
        return { success: true };
      }),
    }),
    comboKits: router({
      list: adminProcedure.query(() => listComboKits()),
      create: adminProcedure.input(z.object({ slug: z.string().min(1).max(180), name: z.string().min(1).max(180), tagline: z.string().optional(), description: z.string().optional(), price: moneyInput, featured: z.number().int().min(0).max(1).optional(), items: z.array(z.object({ productSlug: z.string().min(1), quantity: z.number().int().positive() })).min(1) })).mutation(({ input }) => createComboKit(input).then(() => ({ success: true }))),
      hide: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => hideComboKit(input.id).then(() => ({ success: true }))),
    }),
    comboRequests: router({
      list: adminProcedure.query(() => listComboKitRequests()),
      approve: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => approveComboKitRequest(input.id, ctx.user.id)),
    }),
    customerStories: router({
      list: adminProcedure.query(() => listCustomerStories()),
      create: adminProcedure.input(z.object({ title: z.string().min(1).max(180), customerName: z.string().max(160).optional(), projectType: z.string().max(120).optional(), caption: z.string().optional(), imageUrl: z.string().optional(), featured: z.number().int().min(0).max(1).optional() })).mutation(({ input }) => createCustomerStory({ ...input, featured: input.featured ?? 1 }).then(() => ({ success: true }))),
      hide: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => hideCustomerStory(input.id).then(() => ({ success: true }))),
    }),
    updates: router({
      list: adminProcedure.query(() => listStoreUpdates(false)),
      create: adminProcedure.input(z.object({
        kind: z.enum(["instagram", "youtube", "announcement"]),
        title: z.string().trim().min(1).max(160),
        body: z.string().trim().max(1000).optional(),
        url: z.string().url().max(1000).refine(value => value.startsWith("https://"), "Links must use HTTPS.").optional(),
        imageUrl: z.string().max(1000).refine(value => value.startsWith("https://") || value.startsWith("/uploads/") || value.startsWith("/manus-storage/"), "Image links must use HTTPS or be an uploaded site image.").optional(),
      }).superRefine((input, ctx) => {
        if (input.kind !== "announcement" && !input.url) {
          ctx.addIssue({ code: "custom", path: ["url"], message: "A social post URL is required." });
        }
      })).mutation(({ input, ctx }) => createStoreUpdate({ ...input, active: 1 }, ctx.user.id)),
      hide: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => hideStoreUpdate(input.id, ctx.user.id)),
    }),
    requests: router({
      list: adminProcedure.query(async () => ({ projects: await listProjectRequests(), products: await listProductRequests() })),
    }),
    analytics: router({
      list: adminProcedure.query(() => listAnalyticsEvents()),
    }),
    orders: router({
      list: adminProcedure.query(() => listAdminOrders()),
      transition: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["PAYMENT_PENDING", "ORDER_CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]) })).mutation(({ input, ctx }) => transitionOrderStatus(input.id, input.status, ctx.user.id)),
      verifyPayment: adminProcedure.input(z.object({ id: z.number().int().positive(), reference: z.string().max(160).optional() })).mutation(async ({ input, ctx }) => {
        const result = await verifyOrderPayment(input.id, ctx.user.id, input.reference);
        const invoiceEmail = await emailVerifiedOrderInvoice(input.id, ctx.user.id);
        return { ...result, invoiceEmail };
      }),
      rejectPayment: adminProcedure.input(z.object({ id: z.number().int().positive(), note: z.string().max(500).optional() })).mutation(({ input, ctx }) => rejectOrderPayment(input.id, ctx.user.id, input.note)),
      overrideAmount: adminProcedure.input(z.object({ id: z.number().int().positive(), finalAmount: moneyInput, reason: z.string().max(500).optional() })).mutation(({ input, ctx }) => overrideOrderAmount(input.id, input.finalAmount, ctx.user.id, input.reason)),
      generateInvoice: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => generateOrderInvoice(input.id, ctx.user.id)),
      sendInvoiceEmail: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => emailVerifiedOrderInvoice(input.id, ctx.user.id)),
    }),
    inventory: router({
      movements: adminProcedure.query(() => listInventoryMovements()),
      restock: adminProcedure.input(z.object({ productId: z.number().int().positive(), amount: z.number().int().positive(), note: z.string().max(500).optional() })).mutation(({ input, ctx }) => restockProduct(input.productId, input.amount, ctx.user.id, input.note)),
    }),
    transactions: router({
      list: adminProcedure.query(() => listTransactions()),
    }),
    audit: router({
      list: adminProcedure.query(() => listAuditLogs()),
    }),
    reports: router({
      metrics: adminProcedure.query(() => getCommerceMetrics()),
    }),
    settings: router({
      save: adminProcedure.input(z.object({ businessName: z.string().min(1), whatsappNumber: z.string().optional(), phone: z.string().optional(), email: z.string().optional(), address: z.string().optional(), businessHours: z.string().optional(), mapsUrl: z.string().optional(), instagramUrl: z.string().url().optional(), youtubeUrl: z.string().url().optional(), shippingFee: moneyInput.optional() })).mutation(({ input }) => saveSiteSettings(input).then(() => ({ success: true }))),
    }),
  }),
});

export type AppRouter = typeof appRouter;
