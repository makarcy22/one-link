# Payments (Paystack)

Billing runs in **test mode** until your business is verified. Test cards from
the Paystack docs work end to end without real money.

## Step 1: account + test keys

1. Sign up at `dashboard.paystack.com` (business email).
2. You land in **test mode** automatically — no documents needed yet.
3. Settings → API Keys → copy the **Test Secret Key** into `.env`:
   `PAYSTACK_SECRET_KEY=sk_test_...`

## Step 2: create the two plans

1. Dashboard → **Subscriptions → Plans** (still in test mode) → Create plan.
2. Plan 1: name `One Link Creator`, monthly, your price in kobo/cents → copy its **plan code** into `.env` as `PAYSTACK_PLAN_CREATOR`.
3. Plan 2: name `One Link Business`, monthly, your price → `PAYSTACK_PLAN_BUSINESS`.

## Step 3: webhook URL

1. Dashboard → Settings → **Webhooks** → add:
   `https://<your-api-domain>/api/billing/webhook`
2. For local testing, use the test-mode **event tester** or replay an event; for
   staging, expose localhost with a tunnel and register that URL temporarily.
3. The app verifies every webhook with HMAC-SHA512 (`x-paystack-signature`)
   and only then activates subscriptions — never trust the frontend callback.

## Step 4: test the money flow (no real charge)

1. Profile → Subscription → choose Creator or Business → pay with a **test card**.
2. Webhook fires → subscription row becomes `active` → AI quota jumps to the plan limit.
3. Cancel in the dashboard → webhook marks it `cancelled`. Failed renewal → `past_due`.

## Step 5: go live

1. Dashboard → **Go Live** → submit business documents + bank details.
2. Swap `.env` to **live** keys and **live** plan codes (recreate the plans in live mode).
3. Update the webhook URL to the production API domain.
4. Free plan stays free: no subscription row = 20 AI calls/month enforced in code.

## Quotas enforced today

| Plan | AI calls/month |
|---|---:|
| Free (no subscription) | 20 |
| Creator | 500 |
| Business | 2000 |

Over-limit caption requests return `402` with an upgrade message. Extend the
same `checkAiQuota` pattern to uploads or publishing volume when needed.
