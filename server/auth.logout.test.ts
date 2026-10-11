import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME, REFRESH_COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { getSessionCookieOptions } from "./_core/cookies";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(2);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "lax",
      httpOnly: true,
      path: "/",
    });
    expect(clearedCookies[1]).toEqual({
      name: REFRESH_COOKIE_NAME,
      options: expect.objectContaining({
        maxAge: -1,
        secure: true,
        sameSite: "lax",
        httpOnly: true,
        path: "/api",
      }),
    });
  });

  it("uses a cookie policy that works on local HTTP and secure deployments", () => {
    expect(getSessionCookieOptions({
      protocol: "http",
      headers: {},
    } as Parameters<typeof getSessionCookieOptions>[0])).toMatchObject({
      sameSite: "lax",
      secure: false,
      httpOnly: true,
      path: "/",
    });
    expect(getSessionCookieOptions({
      protocol: "http",
      headers: { "x-forwarded-proto": "https" },
    } as Parameters<typeof getSessionCookieOptions>[0]).secure).toBe(true);
  });
});
