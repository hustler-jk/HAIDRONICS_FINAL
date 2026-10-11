import { ENV } from "./_core/env";
import PDFDocument from "pdfkit";

export type InvoiceEmailItem = {
  productName: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoiceEmailOrder = {
  invoiceId: string;
  orderNumber: string | null;
  createdAt: Date;
  customerName: string;
  address: string;
  phone: string;
  subtotal: number;
  shipping: number;
  finalAmount: number;
  items: InvoiceEmailItem[];
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

function formatPdfINR(amount: number) {
  return `INR ${amount.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

export async function buildInvoicePdf(order: InvoiceEmailOrder) {
  return new Promise<Buffer>((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.fillColor("#17191b").font("Helvetica-Bold").fontSize(22).text("HAIDRONICS", { continued: true });
    document.fillColor("#e95d12").fontSize(12).text(`    ${order.invoiceId}`, { align: "right" });
    document.moveDown(0.35).fillColor("#73777b").font("Helvetica").fontSize(10)
      .text("Where Engineering Starts", { continued: true })
      .text(`Date: ${order.createdAt.toLocaleDateString("en-IN")}`, { align: "right" });
    document.moveDown().strokeColor("#ff6a1a").moveTo(48, document.y).lineTo(547, document.y).stroke();

    document.moveDown().fillColor("#82868a").font("Helvetica-Bold").fontSize(9).text("BILLED TO");
    document.moveDown(0.3).fillColor("#17191b").fontSize(12).text(order.customerName);
    document.font("Helvetica").fontSize(10).text(order.phone).text(order.address, { width: 300 });
    document.moveDown(0.5).fillColor("#137a43").font("Helvetica-Bold").fontSize(10).text("PAYMENT VERIFIED");
    document.moveDown();

    const columns = { item: 48, qty: 345, unit: 405, total: 488 };
    document.fillColor("#686c70").font("Helvetica-Bold").fontSize(9)
      .text("COMPONENT", columns.item, document.y, { width: 285 })
      .text("QTY", columns.qty, document.y, { width: 45, align: "center" })
      .text("UNIT PRICE", columns.unit, document.y, { width: 75, align: "right" })
      .text("AMOUNT", columns.total, document.y, { width: 60, align: "right" });
    document.moveDown(0.7).strokeColor("#d9dcde").moveTo(48, document.y).lineTo(547, document.y).stroke();
    document.moveDown(0.4);

    for (const item of order.items) {
      const rowY = document.y;
      document.fillColor("#17191b").font("Helvetica-Bold").fontSize(10)
        .text(item.productName, columns.item, rowY, { width: 285 });
      if (item.sku) document.fillColor("#73777b").font("Helvetica").fontSize(8).text(item.sku, columns.item, document.y + 2, { width: 285 });
      document.fillColor("#17191b").fontSize(9)
        .text(String(item.quantity), columns.qty, rowY, { width: 45, align: "center" })
        .text(formatPdfINR(item.unitPrice), columns.unit, rowY, { width: 75, align: "right" })
        .text(formatPdfINR(item.lineTotal), columns.total, rowY, { width: 60, align: "right" });
      document.y = Math.max(document.y, rowY + 22);
      document.moveDown(0.45).strokeColor("#e8e8e8").moveTo(48, document.y).lineTo(547, document.y).stroke();
      document.moveDown(0.4);
    }

    const totalsX = 350;
    document.moveDown(0.5).fillColor("#666").font("Helvetica").fontSize(10)
      .text("Subtotal", totalsX, document.y, { width: 100 })
      .text(formatPdfINR(order.subtotal), 455, document.y, { width: 92, align: "right" });
    document.moveDown(0.5)
      .text("Shipping / packing", totalsX, document.y, { width: 100 })
      .text(formatPdfINR(order.shipping), 455, document.y, { width: 92, align: "right" });
    document.moveDown(0.6).strokeColor("#d9dcde").moveTo(totalsX, document.y).lineTo(547, document.y).stroke();
    document.moveDown(0.5).fillColor("#17191b").font("Helvetica-Bold").fontSize(12)
      .text("TOTAL PAID", totalsX, document.y, { width: 100 })
      .fillColor("#e95d12").fontSize(14).text(formatPdfINR(order.finalAmount), 455, document.y, { width: 92, align: "right" });
    document.moveDown(2).fillColor("#73777b").font("Helvetica").fontSize(9)
      .text("Thank you for choosing HAIDRONICS. This invoice confirms that payment for your order has been verified.", 48, document.y, { width: 499, align: "center" });
    document.end();
  });
}

export function buildInvoiceEmailHtml(order: InvoiceEmailOrder) {
  const rows = order.items.map((item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e8e8e8">
        <strong>${escapeHtml(item.productName)}</strong>
        ${item.sku ? `<br><span style="color:#777;font-size:12px">${escapeHtml(item.sku)}</span>` : ""}
      </td>
      <td style="padding:12px;text-align:center;border-bottom:1px solid #e8e8e8">${item.quantity}</td>
      <td style="padding:12px;text-align:right;border-bottom:1px solid #e8e8e8">${formatINR(item.unitPrice)}</td>
      <td style="padding:12px;text-align:right;border-bottom:1px solid #e8e8e8">${formatINR(item.lineTotal)}</td>
    </tr>`).join("");

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f3f4f4;color:#17191b;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:720px;margin:24px auto;padding:24px;background:#fff;border:1px solid #e1e3e4">
    <header style="display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #ff6a1a;padding-bottom:18px">
      <div><div style="font-size:22px;font-weight:800;letter-spacing:3px">HAIDRONICS</div><div style="margin-top:5px;color:#73777b;font-size:12px">Where Engineering Starts</div></div>
      <div style="text-align:right"><div style="color:#e95d12;font-weight:700">${escapeHtml(order.invoiceId)}</div><div style="margin-top:5px;color:#73777b;font-size:12px">Date: ${escapeHtml(order.createdAt.toLocaleDateString("en-IN"))}</div><div style="margin-top:7px;color:#137a43;font-size:11px;font-weight:700">PAYMENT VERIFIED</div></div>
    </header>
    <section style="display:flex;justify-content:space-between;gap:24px;padding:20px 0">
      <div><div style="color:#82868a;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Billed to</div><div style="margin-top:6px;font-weight:700">${escapeHtml(order.customerName)}</div><div style="margin-top:4px;color:#555;font-size:13px">${escapeHtml(order.phone)}</div><div style="margin-top:4px;color:#555;font-size:13px;white-space:pre-line">${escapeHtml(order.address)}</div></div>
      <div style="text-align:right"><div style="color:#82868a;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Order reference</div><div style="margin-top:6px;font-weight:700">${escapeHtml(order.orderNumber || order.invoiceId)}</div></div>
    </section>
    <table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px">
      <thead style="background:#f5f5f5;color:#686c70;font-size:10px;text-align:left;text-transform:uppercase"><tr><th style="padding:10px 12px">Component</th><th style="padding:10px 12px;text-align:center">Qty</th><th style="padding:10px 12px;text-align:right">Unit price</th><th style="padding:10px 12px;text-align:right">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table role="presentation" style="width:100%;max-width:300px;margin:18px 0 0 auto;border-collapse:collapse;font-size:13px">
      <tr><td style="padding:6px;color:#666">Subtotal</td><td style="padding:6px;text-align:right">${formatINR(order.subtotal)}</td></tr>
      <tr><td style="padding:6px;color:#666">Shipping / packing</td><td style="padding:6px;text-align:right">${formatINR(order.shipping)}</td></tr>
      <tr><td style="padding:10px 6px;border-top:1px solid #d9dcde;font-weight:700">Total paid</td><td style="padding:10px 6px;border-top:1px solid #d9dcde;text-align:right;color:#e95d12;font-size:18px;font-weight:700">${formatINR(order.finalAmount)}</td></tr>
    </table>
    <footer style="margin-top:24px;border-top:1px solid #e8e8e8;padding-top:16px;color:#6e7275;font-size:12px;line-height:1.6">Thank you for choosing HAIDRONICS. This invoice confirms that payment for your order has been verified. For help, reply to this email or contact our support team.</footer>
  </div>
</body>
</html>`;
}

export async function sendInvoiceEmail(to: string, order: InvoiceEmailOrder) {
  if (!ENV.resendApiKey || !ENV.invoiceFromEmail) {
    throw new Error("Invoice email is not configured. Set RESEND_API_KEY and INVOICE_FROM_EMAIL.");
  }

  const invoicePdf = await buildInvoicePdf(order);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ENV.invoiceFromEmail,
      to: [to],
      subject: `Your HAIDRONICS invoice ${order.invoiceId}`,
      html: buildInvoiceEmailHtml(order),
      attachments: [{
        filename: `${order.invoiceId}.pdf`,
        content: invoicePdf.toString("base64"),
        content_type: "application/pdf",
      }],
    }),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(`Invoice email provider returned ${response.status}: ${details}`);
  }
}
