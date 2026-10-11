import { describe, expect, it } from "vitest";
import { isDirectGoogleAccount } from "./admin-provisioning";

describe("admin provisioning identity checks", () => {
  it("allows only accounts created directly from verified Google identity", () => {
    expect(isDirectGoogleAccount({ openId: "google:subject-123", loginMethod: "google" })).toBe(true);
    expect(isDirectGoogleAccount({ openId: "user_123_random", loginMethod: "google" })).toBe(false);
    expect(isDirectGoogleAccount({ openId: "google:subject-123", loginMethod: "password" })).toBe(false);
  });
});
