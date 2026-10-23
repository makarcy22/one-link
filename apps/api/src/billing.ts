import { DEFAULT_PRICES_USD, PLANS, isPlanId, type PlanId } from "@one-link/shared";
import { pool } from "./db.js";
import { initPaystackCheckout } from "./payments/paystack.js";
import { verifyPaystackSignature } from "./payments/verify.js";
import { parseLocalPrices, type LocalPrices } from "./payments/currency.js";

// Billing core: what plan a person is on, what they have used, and how a payment becomes a plan.
// Providers live in ./payments (Paystack, Stripe, Flutterwave, manual approval).

export const PLAN_LIMITS: Record<string, { aiMonthly: number; label: string }> = Object.fromEntries(
  Object.values(PLANS).map((p) => [p.id, { aiMonthly: p.aiMonthly, label: p.label }])
);

/** Price in US dollars. The owner can override the placeholder defaults with PRICE_CREATOR_USD / PRICE_BUSINESS_USD. */
export function priceUsd(plan: Exclude<PlanId, "free">): number {
  const env = Number(process.env[plan === "creator" ? "PRICE_CREATOR_USD" : "PRICE_BUSINESS_USD"]);
  return Number.isFinite(env) && env > 0 ? env : DEFAULT_PRICES_USD[plan];
}

export function usdPrices() {
  return { creator: priceUsd("creator"), business: priceUsd("business") };
}

export function localPrices(): LocalPrices {
  return parseLocalPrices(process.env.LOCAL_PRICES);
}

export function isPaidPlan(plan: unknown): plan is Exclude<PlanId, "free"> {
  return isPlanId(plan) && plan !== "free";
}

/**
 * The plan a person gets today.
 * Paystack subscriptions renew on Paystack's side and older rows have no reliable end date,
 * so they stay active until Paystack cancels them. Stripe, Flutterwave and manual payments
 * are only active until their paid period ends.
 */
export async function activePlan(userId: string): Promise<string> {
  const r = await pool.query(
    `SELECT plan FROM subscriptions
     WHERE user_id=$1 AND status='active'
       AND (COALESCE(provider,'paystack')='paystack' OR current_period_end > NOW())
     ORDER BY current_period_end DESC NULLS LAST LIMIT 1`,
    [userId]
  );
  return r.rows[0]?.plan ?? "free";
}

export async function currentSubscription(userId: string) {
  const r = await pool.query(
    `SELECT plan, status, provider, current_period_end FROM subscriptions WHERE user_id=$1
     ORDER BY current_period_end DESC NULLS LAST LIMIT 1`,
    [userId]
  );
  return r.rows[0] ?? null;
}

export async function aiUsageThisMonth(userId: string): Promise<number> {
  const r = await pool.query(
    "SELECT COUNT(*)::int AS n FROM ai_generations WHERE user_id=$1 AND created_at >= date_trunc('month', NOW())",
    [userId]
  );
  return r.rows[0]?.n ?? 0;
}

export async function checkAiQuota(userId: string) {
  const plan = await activePlan(userId);
  const used = await aiUsageThisMonth(userId);
  const limit = (PLAN_LIMITS[plan] ?? PLAN_LIMITS.free).aiMonthly;
  return { plan, used, limit, ok: used < limit };
}

// ---- Paystack (kept compatible with the existing tests and webhook) ----

export async function initCheckout(email: string, userId: string, plan: string) {
  return initPaystackCheckout(email, userId, plan);
}

export function verifyWebhook(rawBody: string, signature: string): boolean {
  return verifyPaystackSignature(rawBody, signature, process.env.PAYSTACK_SECRET_KEY ?? "");
}

export interface ApplyOptions {
  provider: string;
  /** Customer id at the provider (Paystack customer_code, Stripe customer id). */
  customerRef?: string;
  /** Subscription id at the provider. */
  subscriptionRef?: string;
  /** How long this payment covers. Paystack keeps the old 30-day behaviour. */
  days?: number;
}

/** Turns a confirmed payment into an active plan. Safe to call again for a renewal. */
export async function applySubscription(userId: string, plan: string, o: ApplyOptions) {
  const days = o.days ?? 30;
  const interval = `${Math.max(1, Math.floor(days))} days`;
  await pool.query(
    `INSERT INTO subscriptions (user_id, plan, status, paystack_customer_code, paystack_subscription_code, current_period_end, updated_at)
     VALUES ($1,$2,'active',$3,$4,NOW() + $5::interval,NOW())
     ON CONFLICT DO NOTHING`,
    [userId, plan, o.provider === "paystack" ? o.customerRef ?? "" : "", o.provider === "paystack" ? o.subscriptionRef ?? "" : "", interval]
  );
  // A renewal extends from the end of the current period if that is still in the future.
  await pool.query(
    `UPDATE subscriptions SET plan=$1, status='active', provider=$2, provider_ref=$3,
       paystack_customer_code = CASE WHEN $2='paystack' THEN $4 ELSE paystack_customer_code END,
       paystack_subscription_code = CASE WHEN $2='paystack' THEN $5 ELSE paystack_subscription_code END,
       current_period_end = GREATEST(COALESCE(current_period_end, NOW()), NOW()) + $6::interval,
       updated_at=NOW()
     WHERE user_id=$7`,
    [plan, o.provider, o.subscriptionRef ?? "", o.customerRef ?? "", o.subscriptionRef ?? "", interval, userId]
  );
}

export async function markSubscription(userId: string, status: string) {
  await pool.query("UPDATE subscriptions SET status=$1, updated_at=NOW() WHERE user_id=$2", [status, userId]);
}

export async function markByProviderRef(provider: string, ref: string, status: string): Promise<string | null> {
  const r = await pool.query(
    "UPDATE subscriptions SET status=$1, updated_at=NOW() WHERE provider=$2 AND provider_ref=$3 RETURNING user_id",
    [status, provider, ref]
  );
  return (r.rows[0]?.user_id as string | undefined) ?? null;
}

/** Extends a subscription found by its provider reference (Stripe invoice.paid). */
export async function extendByProviderRef(provider: string, ref: string, days: number): Promise<string | null> {
  const r = await pool.query(
    `UPDATE subscriptions SET status='active',
       current_period_end = GREATEST(COALESCE(current_period_end, NOW()), NOW()) + $3::interval, updated_at=NOW()
     WHERE provider=$1 AND provider_ref=$2 RETURNING user_id`,
    [provider, ref, `${days} days`]
  );
  return (r.rows[0]?.user_id as string | undefined) ?? null;
}

/** True the first time an event id is seen, false for a repeat delivery. */
export async function claimEvent(provider: string, eventId: string, type = ""): Promise<boolean> {
  if (!eventId) return true;
  const r = await pool.query(
    "INSERT INTO payment_events (id, provider, event_type) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING",
    [`${provider}:${eventId}`, provider, type]
  );
  return (r.rowCount ?? 0) > 0;
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | undefined): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}
