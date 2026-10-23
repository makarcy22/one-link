import type { FastifyInstance, FastifyRequest } from "fastify";
import { PLANS } from "@one-link/shared";
import { notify } from "../notify.js";
import { pool } from "../db.js";
import { requireUser } from "../session.js";
import {
  PLAN_LIMITS,
  activePlan,
  adminEmails,
  aiUsageThisMonth,
  applySubscription,
  claimEvent,
  currentSubscription,
  extendByProviderRef,
  initCheckout,
  isAdminEmail,
  isPaidPlan,
  markByProviderRef,
  markSubscription,
  localPrices,
  priceUsd,
  usdPrices,
  verifyWebhook,
} from "../billing.js";
import { amountFor, currencyOptions, type PaidPlan } from "../payments/currency.js";
import { FX_ATTRIBUTION, autoLocalPrice, getRates, mergePrices } from "../payments/fx.js";
import { paystackConfigured } from "../payments/paystack.js";
import { createStripeCheckout, stripeConfigured } from "../payments/stripe.js";
import { createFlutterwaveCheckout, flutterwaveConfigured, verifyFlutterwaveTransaction } from "../payments/flutterwave.js";
import { makeTxRef, parseTxRef } from "../payments/flutterwave-ref.js";
import {
  orderProviders,
  verifyFlutterwaveHash,
  verifyStripeSignature,
  type Availability,
  type ProviderKey,
} from "../payments/verify.js";

const rawOf = (req: FastifyRequest) => (req as unknown as { rawBody?: string }).rawBody ?? "";
const header = (req: FastifyRequest, name: string) => String(req.headers[name] ?? "");

function availability(): Availability {
  return {
    paystack: paystackConfigured(),
    stripe: stripeConfigured(),
    flutterwave: flutterwaveConfigured(),
    manual: Boolean(process.env.MANUAL_PAY_INSTRUCTIONS) || adminEmails().length > 0,
  };
}

function countryOf(req: FastifyRequest): string {
  const q = (req.query as Record<string, string | undefined>).country || (req.body as Record<string, string> | undefined)?.country;
  const h = header(req, "cf-ipcountry") || header(req, "x-vercel-ip-country") || header(req, "x-country");
  return (q || h || "").toUpperCase().slice(0, 2);
}

/** Local prices for a country: the owner's fixed prices, plus a live-rate price in the country's own money. */
async function pricing(country: string) {
  const margin = Number(process.env.FX_MARGIN_PERCENT ?? 0);
  const auto = autoLocalPrice(country, usdPrices(), await getRates(), Number.isFinite(margin) ? margin : 0);
  return mergePrices(localPrices(), auto);
}

function returnUrl(): string {
  return process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
}

async function userEmailById(userId: string): Promise<string> {
  const r = await pool.query(`SELECT email FROM "user" WHERE id=$1`, [userId]);
  return (r.rows[0]?.email as string | undefined) ?? "";
}
async function userIdByEmail(email: string): Promise<string | null> {
  const r = await pool.query(`SELECT id FROM "user" WHERE lower(email)=lower($1) LIMIT 1`, [email]);
  return (r.rows[0]?.id as string | undefined) ?? null;
}

export async function billingRoutes(app: FastifyInstance) {
  app.get("/api/billing/status", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const plan = await activePlan(s.user.id);
    const used = await aiUsageThisMonth(s.user.id);
    const limit = (PLAN_LIMITS[plan] ?? PLAN_LIMITS.free).aiMonthly;
    const sub = await currentSubscription(s.user.id);
    const country = countryOf(req);
    const { prices: local, estimated } = await pricing(country);
    const pending = await pool.query(
      "SELECT id, plan, method, reference, currency, amount, created_at FROM payment_requests WHERE user_id=$1 AND status='pending' ORDER BY created_at DESC LIMIT 1",
      [s.user.id]
    );
    return {
      plan,
      used,
      limit,
      renews_or_ends: sub?.current_period_end ?? null,
      provider: sub?.provider ?? null,
      status: sub?.status ?? null,
      providers: orderProviders(countryOf(req), availability()),
      plans: Object.values(PLANS).map((p) => ({
        id: p.id,
        label: p.label,
        blurb: p.blurb,
        features: p.features,
        ai_monthly: p.aiMonthly,
        price_usd: isPaidPlan(p.id) ? priceUsd(p.id) : 0,
      })),
      country,
      currency_options: Object.fromEntries(
        ["paystack", "stripe", "flutterwave", "manual"].map((p) => [
          p,
          currencyOptions(p, usdPrices(), local, country).map((o) => ({ ...o, estimated: Boolean(estimated[o.code]), as_of: estimated[o.code] ?? null })),
        ])
      ),
      fx_attribution: Object.keys(estimated).length ? FX_ATTRIBUTION : null,
      manual_instructions: process.env.MANUAL_PAY_INSTRUCTIONS ?? "",
      pending_request: pending.rows[0] ?? null,
      is_admin: isAdminEmail(s.user.email),
    };
  });

  app.post("/api/billing/checkout", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    if (!isPaidPlan(b.plan)) return reply.status(400).send({ error: "Pick Creator or Business." });
    const offered = orderProviders(countryOf(req) || (b.country ?? "").toUpperCase(), availability());
    const provider = (b.provider as ProviderKey | undefined) ?? offered[0];
    if (!provider || !offered.includes(provider)) {
      return reply.status(400).send({ error: "That payment method is not available yet." });
    }
    const currency = String(b.currency ?? "USD").toUpperCase();
    const { prices: local } = await pricing(countryOf(req));
    const amount = amountFor(provider, currency, b.plan as PaidPlan, usdPrices(), local);
    if (amount === null) return reply.status(400).send({ error: "That currency is not available for this payment method." });
    try {
      if (provider === "paystack") {
        const data = await initCheckout(s.user.email, s.user.id, b.plan);
        return { provider, url: String(data.authorization_url ?? "") };
      }
      if (provider === "stripe") {
        return { provider, url: await createStripeCheckout({ email: s.user.email, userId: s.user.id, plan: b.plan, returnUrl: returnUrl() }) };
      }
      if (provider === "flutterwave") {
        // Remember the exact amount shown, so the payment is checked against it, not against a later rate.
        const txRef = makeTxRef(b.plan, s.user.id);
        await pool.query("INSERT INTO payment_quotes (ref, user_id, plan, currency, amount) VALUES ($1,$2,$3,$4,$5)", [txRef, s.user.id, b.plan, currency, amount]);
        return { provider, url: await createFlutterwaveCheckout({ email: s.user.email, userId: s.user.id, plan: b.plan, returnUrl: returnUrl(), amount, currency, txRef }) };
      }
      return { provider: "manual", url: "", instructions: process.env.MANUAL_PAY_INSTRUCTIONS ?? "", currency, amount };
    } catch (e) {
      req.log.error({ error: String(e) }, "Checkout failed");
      return reply.status(400).send({ error: e instanceof Error ? e.message : "Checkout failed" });
    }
  });

  // ---------- Paystack ----------
  app.post("/api/billing/webhook", async (req, reply) => {
    if (!verifyWebhook(rawOf(req), header(req, "x-paystack-signature"))) {
      return reply.status(401).send({ error: "Invalid signature" });
    }
    const event = (req.body ?? {}) as {
      event?: string;
      data?: {
        id?: number | string;
        reference?: string;
        metadata?: { userId?: string; plan?: string };
        customer?: { customer_code?: string; email?: string };
        subscription?: string;
      };
    };
    try {
      const eventId = String(event.data?.id ?? event.data?.reference ?? "");
      if (eventId && !(await claimEvent("paystack", `${event.event}:${eventId}`, event.event ?? ""))) {
        return { received: true, duplicate: true };
      }
      const email = event.data?.customer?.email || "";
      if (event.event === "charge.success" && event.data?.metadata?.userId) {
        const meta = event.data.metadata;
        await applySubscription(meta.userId as string, isPaidPlan(meta.plan) ? meta.plan : "creator", {
          provider: "paystack",
          customerRef: event.data.customer?.customer_code || "",
          subscriptionRef: typeof event.data.subscription === "string" ? event.data.subscription : "",
          days: 30,
        });
        await notify(meta.userId as string, "billing", "Your plan is active", "Thank you. Your paid plan is now on.", "Profile");
      } else if (event.event === "subscription.disable" && email) {
        const id = await userIdByEmail(email);
        if (id) await markSubscription(id, "cancelled");
      } else if (event.event === "invoice.payment_failed" && email) {
        const id = await userIdByEmail(email);
        if (id) {
          await markSubscription(id, "past_due");
          await notify(id, "billing", "A payment did not go through", "Update your payment method to keep your plan.", "Profile");
        }
      }
    } catch (e) {
      req.log.error({ error: String(e) }, "Webhook handling failed");
      return reply.status(500).send({ error: "Webhook processing failed" });
    }
    return { received: true };
  });

  // ---------- Stripe ----------
  app.post("/api/billing/webhook/stripe", async (req, reply) => {
    if (!verifyStripeSignature(rawOf(req), header(req, "stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET ?? "")) {
      return reply.status(401).send({ error: "Invalid signature" });
    }
    const event = (req.body ?? {}) as {
      id?: string;
      type?: string;
      data?: { object?: Record<string, unknown> };
    };
    const obj = (event.data?.object ?? {}) as Record<string, any>;
    try {
      if (event.id && !(await claimEvent("stripe", event.id, event.type ?? ""))) {
        return { received: true, duplicate: true };
      }
      if (event.type === "checkout.session.completed" && obj.mode === "subscription") {
        const userId = String(obj.metadata?.userId ?? obj.client_reference_id ?? "");
        const plan = String(obj.metadata?.plan ?? "");
        if (userId && isPaidPlan(plan) && obj.payment_status !== "unpaid") {
          await applySubscription(userId, plan, {
            provider: "stripe",
            customerRef: String(obj.customer ?? ""),
            subscriptionRef: String(obj.subscription ?? ""),
            days: 31,
          });
          await notify(userId, "billing", "Your plan is active", "Thank you. Your paid plan is now on.", "Profile");
        }
      } else if (event.type === "invoice.paid" && obj.subscription) {
        await extendByProviderRef("stripe", String(obj.subscription), 31);
      } else if (event.type === "invoice.payment_failed" && obj.subscription) {
        const id = await markByProviderRef("stripe", String(obj.subscription), "past_due");
        if (id) await notify(id, "billing", "A payment did not go through", "Update your payment method to keep your plan.", "Profile");
      } else if (event.type === "customer.subscription.deleted" && obj.id) {
        await markByProviderRef("stripe", String(obj.id), "cancelled");
      }
    } catch (e) {
      req.log.error({ error: String(e) }, "Stripe webhook failed");
      return reply.status(500).send({ error: "Webhook processing failed" });
    }
    return { received: true };
  });

  // ---------- Flutterwave ----------
  app.post("/api/billing/webhook/flutterwave", async (req, reply) => {
    if (!verifyFlutterwaveHash(header(req, "verif-hash"), process.env.FLW_SECRET_HASH ?? "")) {
      return reply.status(401).send({ error: "Invalid signature" });
    }
    const event = (req.body ?? {}) as { event?: string; data?: { id?: number | string; tx_ref?: string } };
    try {
      if (event.event !== "charge.completed" || !event.data?.id) return { received: true };
      if (!(await claimEvent("flutterwave", String(event.data.id), event.event))) return { received: true, duplicate: true };
      // Ask Flutterwave for the real transaction; the webhook body alone is not proof of payment.
      const tx = await verifyFlutterwaveTransaction(event.data.id);
      const ref = tx ? parseTxRef(tx.tx_ref) : null;
      const quote = tx ? (await pool.query("SELECT user_id, plan, currency, amount FROM payment_quotes WHERE ref=$1", [tx.tx_ref])).rows[0] : null;
      if (tx && ref && quote && isPaidPlan(ref.plan) && quote.user_id === ref.userId && quote.plan === ref.plan &&
          tx.status === "successful" && tx.currency === quote.currency && Number(tx.amount) >= Number(quote.amount)) {
        await applySubscription(ref.userId, ref.plan, { provider: "flutterwave", subscriptionRef: String(event.data.id), days: 31 });
        await notify(ref.userId, "billing", "Your plan is active", "Thank you. Your plan is on for one month.", "Profile");
      }
    } catch (e) {
      req.log.error({ error: String(e) }, "Flutterwave webhook failed");
      return reply.status(500).send({ error: "Webhook processing failed" });
    }
    return { received: true };
  });

  // ---------- Manual payments (mobile money / bank transfer, confirmed by the owner) ----------
  app.post("/api/billing/manual", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    if (!isPaidPlan(b.plan)) return reply.status(400).send({ error: "Pick Creator or Business." });
    const currency = String(b.currency ?? "USD").toUpperCase();
    const { prices: localNow } = await pricing(countryOf(req));
    const computed = amountFor("manual", currency, b.plan as PaidPlan, usdPrices(), localNow);
    if (computed === null) return reply.status(400).send({ error: "That currency is not available." });
    // Keep the amount the person was shown if the rate has only drifted a little since (up to 5%).
    // The owner still checks the real payment before confirming.
    const shown = Number(b.amount);
    const amount = Number.isFinite(shown) && shown > 0 && Math.abs(shown - computed) / computed <= 0.05 ? shown : computed;
    const reference = (b.reference ?? "").trim().slice(0, 120);
    if (reference.length < 4) return reply.status(400).send({ error: "Enter the transaction reference from your payment message." });
    const dup = await pool.query("SELECT 1 FROM payment_requests WHERE user_id=$1 AND status='pending'", [s.user.id]);
    if (dup.rows[0]) return reply.status(409).send({ error: "You already have a payment waiting to be confirmed." });
    const { rows } = await pool.query(
      `INSERT INTO payment_requests (user_id, email, plan, method, reference, note, currency, amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, plan, method, reference, status, currency, amount, created_at`,
      [s.user.id, s.user.email, b.plan, (b.method ?? "").slice(0, 60), reference, (b.note ?? "").slice(0, 500), currency, amount]
    );
    for (const email of adminEmails()) {
      const adminId = await userIdByEmail(email);
      if (adminId) {
        await notify(adminId, "billing_admin", "A payment needs confirming", `${s.user.email} paid ${amount} ${currency} for ${b.plan}. Reference ${reference}.`, "Profile", `payreq:${rows[0].id}`);
      }
    }
    return reply.status(201).send(rows[0]);
  });

  async function requireAdmin(req: FastifyRequest, reply: Parameters<typeof requireUser>[1]) {
    const s = await requireUser(req, reply);
    if (!s) return null;
    if (!isAdminEmail(s.user.email)) {
      reply.status(403).send({ error: "Only the owner can do this." });
      return null;
    }
    return s;
  }

  app.get("/api/billing/admin/requests", async (req, reply) => {
    if (!(await requireAdmin(req, reply))) return;
    const { rows } = await pool.query(
      "SELECT * FROM payment_requests WHERE status='pending' ORDER BY created_at ASC LIMIT 100"
    );
    return rows;
  });

  app.post("/api/billing/admin/requests/:id/:action", async (req, reply) => {
    const s = await requireAdmin(req, reply);
    if (!s) return;
    const { id, action } = req.params as { id: string; action: string };
    if (action !== "approve" && action !== "reject") return reply.status(404).send({ error: "Unknown action" });
    const upd = await pool.query(
      `UPDATE payment_requests SET status=$1, reviewed_by=$2, reviewed_at=NOW()
       WHERE id=$3 AND status='pending' RETURNING *`,
      [action === "approve" ? "approved" : "rejected", s.user.email, id]
    );
    const row = upd.rows[0];
    if (!row) return reply.status(404).send({ error: "Request not found or already handled." });
    if (action === "approve" && isPaidPlan(row.plan)) {
      await applySubscription(row.user_id, row.plan, { provider: "manual", subscriptionRef: `manual:${row.id}`, days: 31 });
      await notify(row.user_id, "billing", "Payment confirmed", `Your ${row.plan} plan is on for one month.`, "Profile");
    } else {
      await notify(row.user_id, "billing", "We could not confirm your payment", "Check the reference and send it again, or contact us.", "Profile");
    }
    return { ok: true };
  });
}
