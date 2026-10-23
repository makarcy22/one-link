import { PLANS } from "@one-link/shared";
import { priceUsd, isPaidPlan } from "../billing.js";

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

/** Creates a Stripe Checkout Session for a monthly subscription and returns its hosted payment URL. */
export async function createStripeCheckout(opts: { email: string; userId: string; plan: string; returnUrl: string }) {
  if (!isPaidPlan(opts.plan)) throw new Error("Pick Creator or Business.");
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) throw new Error("Stripe is not configured.");
  const form = new URLSearchParams({
    mode: "subscription",
    customer_email: opts.email,
    client_reference_id: opts.userId,
    success_url: `${opts.returnUrl}?billing=success`,
    cancel_url: `${opts.returnUrl}?billing=cancelled`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(Math.round(priceUsd(opts.plan) * 100)),
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": `One Link ${PLANS[opts.plan].label}`,
    "metadata[userId]": opts.userId,
    "metadata[plan]": opts.plan,
    "subscription_data[metadata][userId]": opts.userId,
    "subscription_data[metadata][plan]": opts.plan,
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: { message?: string } };
  if (!res.ok || !data.url) throw new Error(`Stripe error: ${data.error?.message || res.status}`);
  return data.url;
}
