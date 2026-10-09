import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../session.js";
import {
  PLAN_LIMITS,
  activePlan,
  aiUsageThisMonth,
  applySubscription,
  initCheckout,
  markSubscription,
  verifyWebhook,
} from "../billing.js";

export async function billingRoutes(app: FastifyInstance) {
  app.get("/api/billing/status", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const plan = await activePlan(s.user.id);
    const used = await aiUsageThisMonth(s.user.id);
    const limit = (PLAN_LIMITS[plan] ?? PLAN_LIMITS.free).aiMonthly;
    return { plan, used, limit };
  });

  app.post("/api/billing/checkout", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    try {
      const data = await initCheckout(s.user.email, s.user.id, b.plan);
      return { authorization_url: data.authorization_url };
    } catch (e) {
      return reply.status(400).send({ error: e instanceof Error ? e.message : "Checkout failed" });
    }
  });

  app.post("/api/billing/webhook", async (req, reply) => {
    const raw = (req as unknown as { rawBody?: string }).rawBody ?? "";
    const signature = (req.headers["x-paystack-signature"] as string) ?? "";
    if (!verifyWebhook(raw, signature)) {
      return reply.status(401).send({ error: "Invalid signature" });
    }
    const event = (req.body ?? {}) as {
      event?: string;
      data?: {
        metadata?: { userId?: string; plan?: string };
        customer?: { customer_code?: string; email?: string };
        subscription?: string;
        plan?: { plan_code?: string };
      };
    };
    try {
      if (event.event === "charge.success" && event.data?.metadata?.userId) {
        const meta = event.data.metadata;
        await applySubscription(
          meta.userId as string,
          (meta.plan as string) || "creator",
          event.data.customer?.customer_code || "",
          typeof event.data.subscription === "string" ? event.data.subscription : ""
        );
      } else if (event.event === "subscription.disable") {
        const email = event.data?.customer?.email || "";
        if (email) {
          const found = await pool.query(
            `SELECT u.id FROM "user" u WHERE u.email=$1 LIMIT 1`,
            [email]
          );
          if (found.rows[0]) await markSubscription(found.rows[0].id, "cancelled");
        }
      } else if (event.event === "invoice.payment_failed") {
        const email = event.data?.customer?.email || "";
        if (email) {
          const found = await pool.query(
            `SELECT u.id FROM "user" u WHERE u.email=$1 LIMIT 1`,
            [email]
          );
          if (found.rows[0]) await markSubscription(found.rows[0].id, "past_due");
        }
      }
    } catch (e) {
      req.log.error({ error: String(e) }, "Webhook handling failed");
    }
    return { received: true };
  });
}
