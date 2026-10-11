import { describe, expect, it } from "vitest";
import { isPublicProductImageKey } from "./storageProxy";

describe("public storage keys", () => {
  it("allows only safe product image paths", () => {
    expect(isPublicProductImageKey("haidronics-products/esp32-board.png")).toBe(
      true
    );
  });

  it("rejects paths outside the public product-image namespace", () => {
    expect(isPublicProductImageKey("private/customer-record.pdf")).toBe(false);
    expect(isPublicProductImageKey("haidronics-products/../private.pdf")).toBe(
      false
    );
    expect(isPublicProductImageKey("haidronics-products\\private.pdf")).toBe(
      false
    );
  });
});
