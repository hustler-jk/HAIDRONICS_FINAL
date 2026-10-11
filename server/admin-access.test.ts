import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function createContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin procedure access", () => {
  it("rejects unauthenticated users without exposing admin data", async () => {
    const caller = appRouter.createCaller(createContext(null));

    await expect(caller.admin.products.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.admin.updates.create({
      kind: "announcement",
      title: "Unauthorized highlight",
    })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects signed-in customers", async () => {
    const now = new Date();
    const caller = appRouter.createCaller(createContext({
      id: 42,
      openId: "customer",
      name: "Customer",
      email: "customer@example.com",
      loginMethod: "google",
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    }));

    await expect(caller.admin.products.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
