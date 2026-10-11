import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function createContext(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("public and protected routes", () => {
  it("allows unauthenticated customers to browse the catalog", async () => {
    const caller = appRouter.createCaller(createContext());

    const products = await caller.catalog.list();

    expect(products.length).toBeGreaterThan(0);
  });

  it("rejects unauthenticated order, support, and account operations", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.analytics.track({ event: "product_view" })).resolves.toEqual({ success: true });
    const protectedCalls = [
      () => caller.checkout.create({
        customerName: "Builder",
        phone: "9876543210",
        address: "1 Circuit Street",
        items: [{ slug: "esp32-devkit", quantity: 1 }],
      }),
      () => caller.requests.project({ name: "Builder", phone: "9876543210" }),
      () => caller.requests.product({ component: "ESP32", quantity: 1 }),
      () => caller.newsletter.subscribe({ email: "builder@example.com" }),
      () => caller.account.history(),
      () => caller.account.order({ id: 1 }),
      () => caller.auth.updateProfile({ name: "Builder" }),
    ];

    for (const call of protectedCalls) {
      await expect(call()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
  });

  it("returns no account information when auth.me is called anonymously", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.auth.me()).resolves.toBeNull();
  });

  it("does not return password hashes or internal identifiers from auth.me", async () => {
    const now = new Date();
    const user = {
      id: 7,
      openId: "internal-user-id",
      name: "Builder",
      email: "builder@example.com",
      phone: null,
      address: null,
      password: "$scrypt$private-hash",
      loginMethod: "password",
      role: "user" as const,
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
    const caller = appRouter.createCaller(createContext(user));

    const profile = await caller.auth.me();

    expect(profile).not.toHaveProperty("password");
    expect(profile).not.toHaveProperty("openId");
    expect(profile).toMatchObject({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  });
});
