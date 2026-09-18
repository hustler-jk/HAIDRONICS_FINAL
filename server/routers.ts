import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createCatalogProduct, createComboKit, createCustomerStory, createOrder, deleteCatalogProduct, getCatalogProduct, getSiteSettings, hideComboKit, hideCustomerStory, listAnalyticsEvents, listCatalogProducts, listComboKits, listCustomerStories, listOrdersForUser, listProductRequests, listProjectRequests, listRequestsForUser, recordAnalyticsEvent, saveProductRequest, saveProjectRequest, saveSiteSettings, searchCatalogProducts, subscribeNewsletter, updateCatalogProduct } from "./db";
import { storagePut } from "./storage";

const productInput = z.object({
  slug: z.string().min(1).max(180), name: z.string().min(1).max(180), sku: z.string().max(80).optional(), price: z.number().int().nonnegative(), shortDescription: z.string().optional(), description: z.string().optional(), category: z.string().max(80).optional(), tags: z.string().optional(), specs: z.string().optional(), imageUrl: z.string().optional(), stockStatus: z.enum(["In stock", "Limited", "Out of stock"]).optional(), featured: z.number().int().min(0).max(1).optional(),
});

export const appRouter = router({
  system: router({}),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  catalog: router({
    list: publicProcedure.query(() => listCatalogProducts()),
    search: publicProcedure.input(z.object({ query: z.string().max(180) })).query(({ input }) => input.query.trim() ? searchCatalogProducts(input.query) : listCatalogProducts()),
    get: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => getCatalogProduct(input.slug)),
    comboKits: publicProcedure.query(() => listComboKits()),
    customerStories: publicProcedure.query(() => listCustomerStories()),
    settings: publicProcedure.query(() => getSiteSettings()),
  }),
  analytics: router({
    track: publicProcedure.input(z.object({ event: z.string().max(80), productId: z.string().max(180).optional(), query: z.string().max(180).optional(), path: z.string().max(255).optional() })).mutation(({ input }) => recordAnalyticsEvent(input).then(() => ({ success: true }))),
  }),
  requests: router({
    project: publicProcedure.input(z.object({ name: z.string().min(1), phone: z.string().min(1), projectName: z.string().optional(), building: z.string().optional(), components: z.string().optional(), budget: z.string().optional() })).mutation(({ input, ctx }) => saveProjectRequest({ ...input, userId: ctx.user?.id }).then(() => ({ success: true }))),
    product: publicProcedure.input(z.object({ component: z.string().min(1), quantity: z.number().int().positive().default(1), reference: z.string().optional(), notes: z.string().optional() })).mutation(({ input, ctx }) => saveProductRequest({ ...input, userId: ctx.user?.id }).then(() => ({ success: true }))),
  }),
  newsletter: router({
    subscribe: publicProcedure.input(z.object({ email: z.string().email() })).mutation(({ input }) => subscribeNewsletter(input.email).then(() => ({ success: true }))),
  }),
  checkout: router({
    create: publicProcedure.input(z.object({ customerName: z.string().min(2), phone: z.string().min(7), address: z.string().min(8), items: z.string().min(2), total: z.number().int().positive() })).mutation(({ input, ctx }) => createOrder({ ...input, userId: ctx.user?.id }).then(() => ({ success: true }))),
  }),
  account: router({
    history: protectedProcedure.query(({ ctx }) => listRequestsForUser(ctx.user.id).then(async (requests) => ({ ...requests, orders: await listOrdersForUser(ctx.user.id) }))),
  }),
  admin: router({
    products: router({
      list: adminProcedure.query(() => listCatalogProducts()),
      create: adminProcedure.input(productInput).mutation(({ input }) => createCatalogProduct(input).then(() => ({ success: true }))),
      update: adminProcedure.input(productInput.partial().extend({ id: z.number().int().positive() })).mutation(({ input }) => { const { id, ...product } = input; return updateCatalogProduct(id, product).then(() => ({ success: true })); }),
      uploadImage: adminProcedure.input(z.object({ filename: z.string().max(180), contentType: z.string().regex(/^image\/(png|jpeg|webp)$/), base64: z.string().min(100) })).mutation(async ({ input }) => { const safeFilename = input.filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-"); const data = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64"); return storagePut(`haidronics-products/${safeFilename}`, data, input.contentType); }),
      hide: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteCatalogProduct(input.id).then(() => ({ success: true }))),
    }),
    comboKits: router({
      list: adminProcedure.query(() => listComboKits()),
      create: adminProcedure.input(z.object({ slug: z.string().min(1).max(180), name: z.string().min(1).max(180), tagline: z.string().optional(), description: z.string().optional(), price: z.number().int().nonnegative(), featured: z.number().int().min(0).max(1).optional(), items: z.array(z.object({ productSlug: z.string().min(1), quantity: z.number().int().positive() })).min(1) })).mutation(({ input }) => createComboKit(input).then(() => ({ success: true }))),
      hide: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => hideComboKit(input.id).then(() => ({ success: true }))),
    }),
    customerStories: router({
      list: adminProcedure.query(() => listCustomerStories()),
      create: adminProcedure.input(z.object({ title: z.string().min(1).max(180), customerName: z.string().max(160).optional(), projectType: z.string().max(120).optional(), caption: z.string().optional(), imageUrl: z.string().optional(), featured: z.number().int().min(0).max(1).optional() })).mutation(({ input }) => createCustomerStory({ ...input, featured: input.featured ?? 1 }).then(() => ({ success: true }))),
      hide: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => hideCustomerStory(input.id).then(() => ({ success: true }))),
    }),
    requests: router({
      list: adminProcedure.query(async () => ({ projects: await listProjectRequests(), products: await listProductRequests() })),
    }),
    analytics: router({
      list: adminProcedure.query(() => listAnalyticsEvents()),
    }),
    settings: router({
      save: adminProcedure.input(z.object({ businessName: z.string().min(1), whatsappNumber: z.string().optional(), phone: z.string().optional(), email: z.string().optional(), address: z.string().optional(), businessHours: z.string().optional(), mapsUrl: z.string().optional(), instagramUrl: z.string().url().optional(), youtubeUrl: z.string().url().optional() })).mutation(({ input }) => saveSiteSettings(input).then(() => ({ success: true }))),
    }),
  }),
});

export type AppRouter = typeof appRouter;
