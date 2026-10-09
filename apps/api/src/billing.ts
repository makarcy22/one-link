import { createHmac, timingSafeEqual } from "node:crypto";
import { pool } from "./db.js";

// Paystack billing: test mode first, live after business verification.
// Plans are created in the Paystack dashboard; their codes live in .env.

export const PLAN_LIMITS: Record<string, { aiMonthly: number; label: string }> = {
  free: { aiMonthly: 20, label: "Free" },
  creator: { aiMonthly: 500, label: "Creator" },
  business: { aiMonthly: 2000, label: "Business" },
};

function planCode(plan: string): string {
  if (plan === "creator") return process.env.PAYSTACK_PLAN_CREATOR ?? "";
  if (plan === "business") return process.env.PAYSTACK_PLAN_BUSINESS ?? "";
  throw new Error(`Unknown plan: ${plan}`);
}

export async function activePlan(userId: string): Promise<string> {
  const r = await pool.query(
    `SELECT plan FROM subscriptions WHERE user_id=$1 AND status='active'
     ORDER BY current_period_end DESC NULLS LAST LIMIT 1`,
    [userId]
  );
  return r.rows[0]?.plan ?? "free";
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

async function paystack(path: string, body: unknown) {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  const res = await fetch(`https://api.paystack.co${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: Record<string, unknown>;
  };
  if (!res.ok || !data.status) {
    throw new Error(`Paystack error: ${data.message || res.status}`);
  }
  return data.data ?? {};
}

export async function initCheckout(email: string, userId: string, plan: string) {
  const code = planCode(plan);
  if (!code) throw new Error(`No Paystack plan code configured for "${plan}".`);
  return paystack("/transaction/initialize", {
    email,
    plan: code,
    metadata: { userId, plan },
  });
}

export function verifyWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  if (!secret || !signature) return false;
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
  if (hash.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

export async function applySubscription(
  userId: string,
  plan: string,
  customerCode: string,
  subscriptionCode: string
) {
  await pool.query(
    `INSERT INTO subscriptions (user_id, plan, status, paystack_customer_code, paystack_subscription_code, current_period_end, updated_at)
     VALUES ($1,$2,'active',$3,$4,NOW() + INTERVAL '30 days',NOW())
     ON CONFLICT DO NOTHING`
  , [userId, plan, customerCode, subscriptionCode]);
  await pool.query(
    `UPDATE subscriptions SET plan=$1, status='active', paystack_customer_code=$2,
     paystack_subscription_code=$3, current_period_end=NOW() + INTERVAL '30 days', updated_at=NOW()
     WHERE user_id=$4`,
    [plan, customerCode, subscriptionCode, userId]
  );
}

export async function markSubscription(userId: string, status: string) {
  await pool.query(
    "UPDATE subscriptions SET status=$1, updated_at=NOW() WHERE user_id=$2",
    [status, userId]
  );
}
