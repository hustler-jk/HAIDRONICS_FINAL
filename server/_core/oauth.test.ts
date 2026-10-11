import { describe, expect, it } from "vitest";
import { isSafeReturnPath } from "./oauth";

describe("Google OAuth return paths", () => {
  it("allows safe in-app paths with queries", () => {
    expect(isSafeReturnPath("/account?next=%2Fadmin")).toBe(true);
    expect(isSafeReturnPath("/admin")).toBe(true);
  });

  it("rejects external, malformed, and OAuth callback paths", () => {
    expect(isSafeReturnPath("https://attacker.example")).toBe(false);
    expect(isSafeReturnPath("//attacker.example")).toBe(false);
    expect(isSafeReturnPath("/\\attacker.example")).toBe(false);
    expect(isSafeReturnPath("/api/oauth/google/callback")).toBe(false);
    expect(isSafeReturnPath(undefined)).toBe(false);
  });
});
