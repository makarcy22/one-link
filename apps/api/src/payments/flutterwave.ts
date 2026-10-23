import { PLANS } from "@one-link/shared";
import { isPaidPlan } from "../billing.js";

export function flutterwaveConfigured(): boolean {
  return Boolean(process.env.FLW_SECRET_KEY && process.env.FLW_SECRET_HASH);
}

const BASE = "https://api.flutterwave.com/v3";

/** One-month payment page: card, bank, and mobile money where Flutterwave offers it. */
export async function createFlutterwaveCheckout(opts: { email: string; userId: string; plan: string; returnUrl: string; amount: number; currency: string; txRef: string }) {
  if (!isPaidPlan(opts.plan)) throw new Error("Pick Creator or Business.");
  const key = process.env.FLW_SECRET_KEY ?? "";
  if (!key) throw new Error("Flutterwave is not configured.");
  const res = await fetch(`${BASE}/payments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      tx_ref: opts.txRef,
      amount: opts.amount,
      currency: opts.currency,
      redirect_url: `${opts.returnUrl}?billing=success`,
      customer: { email: opts.email },
      customizations: { title: "One Link", description: `${PLANS[opts.plan].label} plan, 1 month` },
      payment_options: opts.currency === "USD" ? "card,banktransfer" : "card,mobilemoneyuganda,mobilemoneykenya,mobilemoneyrwanda,mobilemoneytanzania,banktransfer",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { status?: string; message?: string; data?: { link?: string } };
  if (!res.ok || data.status !== "success" || !data.data?.link) {
    throw new Error(`Flutterwave error: ${data.message || res.status}`);
  }
  return data.data.link;
}

export interface FlwTransaction {
  status: string;
  tx_ref: string;
  amount: number;
  currency: string;
}

/** Never trust the webhook body alone: ask Flutterwave for the transaction itself. */
export async function verifyFlutterwaveTransaction(id: string | number): Promise<FlwTransaction | null> {
  const key = process.env.FLW_SECRET_KEY ?? "";
  if (!key) return null;
  const res = await fetch(`${BASE}/transactions/${encodeURIComponent(String(id))}/verify`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data = (await res.json().catch(() => ({}))) as { status?: string; data?: FlwTransaction };
  if (!res.ok || data.status !== "success" || !data.data) return null;
  return data.data;
}
