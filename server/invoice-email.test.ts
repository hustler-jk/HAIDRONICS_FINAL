import { describe, expect, it } from "vitest";
import { buildInvoiceEmailHtml, buildInvoicePdf, type InvoiceEmailOrder } from "./invoice-email";

const order: InvoiceEmailOrder = {
  invoiceId: "INV-2026-000001",
  orderNumber: "HAI-2026-000001",
  createdAt: new Date("2026-10-10T00:00:00.000Z"),
  customerName: "<Builder>",
  address: "12 Circuit Street",
  phone: "9876543210",
  subtotal: 798,
  shipping: 50,
  finalAmount: 848,
  items: [{ productName: "ESP32 & Sensor", sku: "HD-ESP32-001", quantity: 2, unitPrice: 399, lineTotal: 798 }],
};

describe("invoice email", () => {
  it("renders an itemized verified invoice and escapes customer-controlled content", () => {
    const html = buildInvoiceEmailHtml(order);

    expect(html).toContain("INV-2026-000001");
    expect(html).toContain("PAYMENT VERIFIED");
    expect(html).toContain("Subtotal");
    expect(html).toContain("Shipping / packing");
    expect(html).toContain("₹848");
    expect(html).toContain("&lt;Builder&gt;");
    expect(html).toContain("ESP32 &amp; Sensor");
    expect(html).not.toContain("<Builder>");
  });

  it("keeps fractional rupee amounts on emailed invoices", () => {
    const html = buildInvoiceEmailHtml({
      ...order,
      subtotal: 4.5,
      finalAmount: 5,
      items: [{ productName: "LED", sku: null, quantity: 3, unitPrice: 1.5, lineTotal: 4.5 }],
    });

    expect(html).toContain("₹1.50");
    expect(html).toContain("₹4.50");
    expect(html).toContain("₹5");
  });

  it("generates an attached PDF invoice", async () => {
    const pdf = await buildInvoicePdf(order);

    expect(pdf.subarray(0, 8).toString("ascii")).toBe("%PDF-1.3");
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
