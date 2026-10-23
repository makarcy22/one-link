export async function paystackPost(path: string, body: unknown) {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  if (!secret) throw new Error("Paystack is not configured.");
  const res = await fetch(`https://api.paystack.co${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: Record<string, unknown> };
  if (!res.ok || !data.status) throw new Error(`Paystack error: ${data.message || res.status}`);
  return data.data ?? {};
}

function planCode(plan: string): string {
  if (plan === "creator") return process.env.PAYSTACK_PLAN_CREATOR ?? "";
  if (plan === "business") return process.env.PAYSTACK_PLAN_BUSINESS ?? "";
  throw new Error(`Unknown plan: ${plan}`);
}

export function paystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_PLAN_CREATOR && process.env.PAYSTACK_PLAN_BUSINESS);
}

export async function initPaystackCheckout(email: string, userId: string, plan: string) {
  const code = planCode(plan);
  if (!code) throw new Error(`No Paystack plan code configured for "${plan}".`);
  return paystackPost("/transaction/initialize", { email, plan: code, metadata: { userId, plan } });
}
