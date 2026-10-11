import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { COOKIE_NAME, REFRESH_COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { User } from "../../drizzle/schema";
import { clearSessionCookies, refreshSessionCookies } from "../auth/session";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }

  if (!user) {
    try {
      user = await refreshSessionCookies(opts.req, opts.res);
    } catch (error) {
      console.error("[Auth] Failed to refresh session", error);
    }
  }
  if (!user) {
    const cookies = parseCookieHeader(opts.req.headers.cookie ?? "");
    if (cookies[COOKIE_NAME] || cookies[REFRESH_COOKIE_NAME]) {
      try {
        await clearSessionCookies(opts.req, opts.res);
      } catch (error) {
        console.error("[Auth] Failed to clear invalid session cookies", error);
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
