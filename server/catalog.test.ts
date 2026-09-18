import { describe, expect, it } from "vitest";
import { cartMessage, findProduct, formatINR, normalizeApiComboKits, products, recommendedProducts, whatsappLink } from "../client/src/lib/catalog";

describe("HAIDRONICS catalog helpers", () => {
  it("keeps the starter catalog populated with featured products", () => {
    expect(products.length).toBeGreaterThanOrEqual(6);
    expect(products.filter((product) => product.featured).length).toBeGreaterThanOrEqual(4);
  });

  it("formats Indian rupee prices consistently", () => {
    expect(formatINR(399)).toBe("₹399");
    expect(formatINR(123456)).toBe("₹1,23,456");
  });

  it("finds a product by slug-like id", () => {
    expect(findProduct("esp32-devkit")?.sku).toBe("HD-ESP32-001");
    expect(findProduct("missing-product")).toBeUndefined();
  });

  it("creates an order enquiry message without implying confirmation", () => {
    const product = findProduct("esp32-devkit")!;
    const message = cartMessage([{ ...product, quantity: 2 }]);
    expect(message).toContain("Order Enquiry – HAIDRONICS");
    expect(message).toContain("ESP32 DevKit V1 (HD-ESP32-001) × 2");
    expect(message).toContain("Please confirm availability");
    expect(message).not.toContain("Payment Successful");
  });

  it("includes customer details and line-item pricing in checkout messages", () => {
    const product = findProduct("esp32-devkit")!;
    const message = cartMessage([{ ...product, quantity: 2 }], { name: "A Builder", phone: "9876543210", address: "12 Circuit Street, Chennai" });
    expect(message).toContain("Customer name: A Builder");
    expect(message).toContain("Phone / WhatsApp: 9876543210");
    expect(message).toContain("Delivery address: 12 Circuit Street, Chennai");
    expect(message).toContain("₹798");
  });

  it("targets the HAIDRONICS business WhatsApp chat", () => {
    expect(whatsappLink("hello")).toContain("https://wa.me/918248453861?text=");
  });

  it("ranks same-category products first for recommendations", () => {
    const product = findProduct("esp32-devkit")!;
    expect(recommendedProducts(product, products)[0].category).toBe(product.category);
  });

  it("normalizes combo kits returned by the catalog API", () => {
    const kits = normalizeApiComboKits([{ id: 7, slug: "iot-starter", name: "IoT Starter", price: 999, featured: 1, items: [{ productSlug: "esp32-devkit", quantity: 1 }] }]);
    expect(kits[0]).toMatchObject({ id: 7, slug: "iot-starter", name: "IoT Starter", price: 999, featured: true });
    expect(kits[0].items[0].productSlug).toBe("esp32-devkit");
  });
});
