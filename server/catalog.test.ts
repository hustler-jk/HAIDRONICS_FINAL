import { describe, expect, it } from "vitest";
import { billingCatalog } from "@shared/billingCatalog";
import { cartMessage, categories, categoriesForProducts, findProduct, formatINR, moneyToPaise, normalizeApiComboKits, normalizeApiProducts, paiseToMoney, products, recommendedProducts, whatsappLink } from "../client/src/lib/catalog";
import { DEFAULT_SEED_PRODUCTS, getCatalogProduct, toPublicCatalogProduct } from "./db";

describe("HAIDRONICS catalog helpers", () => {
  it("keeps the starter catalog populated with featured products", () => {
    expect(products.length).toBeGreaterThanOrEqual(6);
    expect(products.filter((product) => product.featured).length).toBeGreaterThanOrEqual(4);
  });

  it("includes every unique billing catalog product in storefront and server fallback data", () => {
    expect(billingCatalog).toHaveLength(151);
    expect(new Set(billingCatalog.map((product) => product.slug)).size).toBe(billingCatalog.length);
    expect(new Set(billingCatalog.map((product) => product.sku)).size).toBe(billingCatalog.length);

    const storefrontProducts = new Map(products.map((product) => [product.id, product]));
    const fallbackProducts = new Map(DEFAULT_SEED_PRODUCTS.map((product) => [product.slug, product]));
    for (const billingProduct of billingCatalog) {
      expect(storefrontProducts.get(billingProduct.slug)).toMatchObject({
        name: billingProduct.name,
        sku: billingProduct.sku,
        price: billingProduct.price,
        category: billingProduct.category,
      });
      expect(fallbackProducts.get(billingProduct.slug)).toMatchObject({
        name: billingProduct.name,
        sku: billingProduct.sku,
        price: billingProduct.price,
        category: billingProduct.category,
      });
      expect(categories).toContain(billingProduct.category);
    }

    expect(findProduct("white-led")?.price).toBe(1.5);
  });

  it("builds storefront category filters from current catalog categories", () => {
    expect(categoriesForProducts([
      { ...findProduct("arduino-uno")!, category: "Boards" },
      { ...findProduct("arduino-nano")!, category: "Wires & Cables" },
    ])).toEqual(["All", "Boards", "Wires & Cables"]);
  });

  it("formats Indian rupee prices consistently", () => {
    expect(formatINR(399)).toBe("₹399");
    expect(formatINR(123456)).toBe("₹1,23,456");
    expect(formatINR(1.5)).toBe("₹1.50");
    expect(formatINR(1234.5)).toBe("₹1,234.50");
  });

  it("calculates paise without floating-point drift", () => {
    expect(paiseToMoney(moneyToPaise(1.5) * 3)).toBe(4.5);
    expect(paiseToMoney(moneyToPaise(2.5) + moneyToPaise(1.5))).toBe(4);
  });

  it("finds a product by slug-like id", () => {
    expect(findProduct("esp32-devkit")?.sku).toBe("HD-ESP32-001");
    expect(findProduct("missing-product")).toBeUndefined();
  });

  it("creates an order enquiry message without implying confirmation", () => {
    const product = findProduct("esp32-devkit")!;
    const message = cartMessage([{ ...product, quantity: 2 }]);
    expect(message).toContain("HAIDRONICS Order Request");
    expect(message).toContain("*ESP32* (HD-ESP32-001)");
    expect(message).toContain("2 × ₹350 = ₹700");
    expect(message).toContain("Please verify component availability");
    expect(message).not.toContain("Payment Successful");
  });

  it("includes customer details and line-item pricing in checkout messages", () => {
    const product = findProduct("esp32-devkit")!;
    const message = cartMessage([{ ...product, quantity: 2 }], { name: "A Builder", phone: "9876543210", address: "12 Circuit Street, Chennai" });
    expect(message).toContain("Name: A Builder");
    expect(message).toContain("Phone: 9876543210");
    expect(message).toContain("Address: 12 Circuit Street, Chennai");
    expect(message).toContain("₹700");
  });

  it("targets the HAIDRONICS business WhatsApp chat", () => {
    expect(whatsappLink("hello")).toContain("https://wa.me/918248453861?text=");
  });

  it("ranks same-category products first for recommendations", () => {
    const product = findProduct("esp32-devkit")!;
    expect(recommendedProducts(product, products)[0].category).toBe("Displays");
  });

  it("normalizes combo kits returned by the catalog API", () => {
    const kits = normalizeApiComboKits([{ id: 7, slug: "iot-starter", name: "IoT Starter", price: 999, featured: 1, items: [{ productSlug: "esp32-devkit", quantity: 1 }] }]);
    expect(kits[0]).toMatchObject({ id: 7, slug: "iot-starter", name: "IoT Starter", price: 999, featured: true });
    expect(kits[0].items[0].productSlug).toBe("esp32-devkit");
  });

  it("normalizes up to four product photos and falls back to legacy image URLs", () => {
    const normalized = normalizeApiProducts([
      { id: 1, slug: "photo-board", imageUrl: "https://images.example/cover.jpg", images: JSON.stringify(["https://images.example/one.jpg", "https://images.example/two.jpg", "https://images.example/three.jpg", "https://images.example/four.jpg", "https://images.example/five.jpg"]) },
      { id: 2, slug: "legacy-board", imageUrl: "https://images.example/legacy.jpg", images: "not-json" },
    ]);

    expect(normalized[0].images).toEqual([
      "https://images.example/one.jpg",
      "https://images.example/two.jpg",
      "https://images.example/three.jpg",
      "https://images.example/four.jpg",
    ]);
    expect(normalized[1].images).toEqual(["https://images.example/legacy.jpg"]);
  });

  it("removes exact inventory counts from public product data", () => {
    const product = DEFAULT_SEED_PRODUCTS[0];
    const publicProduct = toPublicCatalogProduct(product);

    expect(publicProduct.stockStatus).toBe("In stock");
    expect(publicProduct).not.toHaveProperty("stock");
    expect(publicProduct).not.toHaveProperty("lowStockThreshold");
    expect(product.stock).toBe(85);
    expect(toPublicCatalogProduct({ ...product, stock: 5, lowStockThreshold: 10 }).stockStatus).toBe("Limited");
    expect(toPublicCatalogProduct({ ...product, stock: 3, lowStockThreshold: 5, stockStatus: "Out of stock" }).stockStatus).toBe("Limited");
    expect(toPublicCatalogProduct({ ...product, stock: 0 }).stockStatus).toBe("Out of stock");
  });

  it("returns no product for an unknown catalog slug instead of another product", async () => {
    await expect(getCatalogProduct("not-a-real-product")).resolves.toBeUndefined();
    await expect(getCatalogProduct("esp32-devkit")).resolves.toMatchObject({ slug: "esp32-devkit" });
  });
});
