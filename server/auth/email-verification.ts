import { ENV } from "../_core/env";

export function isEmailVerificationConfigured() {
  return Boolean(ENV.resendApiKey && ENV.invoiceFromEmail);
}

export async function sendEmailVerification(to: string, name: string, token: string, baseUrl: string) {
  if (!isEmailVerificationConfigured()) {
    throw new Error("Email verification is not configured. Set RESEND_API_KEY and INVOICE_FROM_EMAIL to a verified sender.");
  }
  const origin = (ENV.publicAppUrl || baseUrl).replace(/\/+$/, "");
  const verificationUrl = new URL(`/account?verify=${encodeURIComponent(token)}`, `${origin}/`).toString();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${ENV.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ENV.invoiceFromEmail,
      to: [to],
      subject: "Verify your HAIDRONICS account",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#16191b"><h1>Verify your email</h1><p>Hello ${escapeHtml(name)},</p><p>Confirm that you can receive email at this address to activate your HAIDRONICS account.</p><p><a href="${verificationUrl}" style="display:inline-block;background:#ff6417;color:#111;padding:12px 18px;text-decoration:none;font-weight:bold">Verify email</a></p><p>This link expires in 30 minutes. If you did not create this account, you can ignore this email.</p></div>`,
    }),
  });
  if (!response.ok) {
    const details = (await response.text()).slice(0, 400);
    throw new Error(`Email provider returned ${response.status}: ${details}`);
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
