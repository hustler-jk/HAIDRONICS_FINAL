import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createCatalogProduct, deleteCatalogProduct, getCatalogProduct, getSiteSettings, listCatalogProducts, recordAnalyticsEvent, saveProductRequest, saveProjectRequest } from "./db";

const productInput = z.object({
  slug: z.string().min(1).max(180), name: z.string().min(1).max(180), sku: z.string().max(80).optional(), price: z.number().int().nonnegative(), shortDescription: z.string().optional(), description: z.string().optional(), category: z.string().max(80).optional(), tags: z.string().optional(), specs: z.string().optional(), imageUrl: z.string().optional(), featured: z.number().int().min(0).max(1).optional(),
});

export const appRouter = router({
  system: router({}),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  catalog: router({
    list: publicProcedure.query(() => listCatalogProducts()),
    get: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => getCatalogProduct(input.slug)),
    settings: publicProcedure.query(() => getSiteSettings()),
  }),
  analytics: router({
    track: publicProcedure.input(z.object({ event: z.string().max(80), productId: z.string().max(180).optional(), query: z.string().max(180).optional(), path: z.string().max(255).optional() })).mutation(({ input }) => recordAnalyticsEvent(input).then(() => ({ success: true }))),
  }),
  requests: router({
    project: publicProcedure.input(z.object({ name: z.string().min(1), phone: z.string().min(1), projectName: z.string().optional(), building: z.string().optional(), components: z.string().optional(), budget: z.string().optional() })).mutation(({ input }) => saveProjectRequest(input).then(() => ({ success: true }))),
    product: publicProcedure.input(z.object({ component: z.string().min(1), quantity: z.number().int().positive().default(1), reference: z.string().optional(), notes: z.string().optional() })).mutation(({ input }) => saveProductRequest(input).then(() => ({ success: true }))),
  }),
  admin: router({
    products: router({
      list: adminProcedure.query(() => listCatalogProducts()),
      create: adminProcedure.input(productInput).mutation(({ input }) => createCatalogProduct(input).then(() => ({ success: true }))),
      hide: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteCatalogProduct(input.id).then(() => ({ success: true }))),
    }),
  }),
});

export type AppRouter = typeof appRouter;
