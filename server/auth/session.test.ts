import { ACCESS_TOKEN_TTL_MS, ADMIN_SESSION_IDLE_TTL_MS, ADMIN_SESSION_MAX_TTL_MS, CUSTOMER_SESSION_IDLE_TTL_MS, CUSTOMER_SESSION_MAX_TTL_MS } from "@shared/const";
import { describe, expect, it, vi } from "vitest";

vi.mock("../_core/env", () => ({
  ENV: {
    appId: "haidronics-test",
    cookieSecret: "test-cookie-secret-with-at-least-32-characters",
  },
}));

import { sdk } from "../_core/sdk";
import { getSessionLifetimes } from "./session";

describe("authentication session policy", () => {
  it("uses short access tokens with role-specific refresh lifetimes", () => {
    expect(ACCESS_TOKEN_TTL_MS).toBe(15 * 60 * 1000);
    expect(getSessionLifetimes({ role: "user" })).toEqual({
      idle: CUSTOMER_SESSION_IDLE_TTL_MS,
      absolute: CUSTOMER_SESSION_MAX_TTL_MS,
    });
    expect(getSessionLifetimes({ role: "admin" })).toEqual({
      idle: ADMIN_SESSION_IDLE_TTL_MS,
      absolute: ADMIN_SESSION_MAX_TTL_MS,
    });
    expect(CUSTOMER_SESSION_IDLE_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
    expect(CUSTOMER_SESSION_MAX_TTL_MS).toBe(90 * 24 * 60 * 60 * 1000);
    expect(ADMIN_SESSION_IDLE_TTL_MS).toBe(12 * 60 * 60 * 1000);
    expect(ADMIN_SESSION_MAX_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });

  it("binds each access token to its revocable server-side session", async () => {
    const token = await sdk.createSessionToken("user_123", {
      name: "Test User",
      sessionId: 42,
      expiresInMs: 60_000,
    });

    await expect(sdk.verifySession(token)).resolves.toMatchObject({
      openId: "user_123",
      name: "Test User",
      sessionId: 42,
    });
  });

  it("rejects expired access tokens", async () => {
    const token = await sdk.createSessionToken("user_123", {
      name: "Test User",
      sessionId: 42,
      expiresInMs: -1_000,
    });

    await expect(sdk.verifySession(token)).resolves.toBeNull();
  });
});
