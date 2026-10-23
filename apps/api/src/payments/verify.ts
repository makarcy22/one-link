// Pure payment helpers (no network, no database), so they are easy to test.
import { hmacHex, safeEqual } from "@one-link/shared/node";

export type ProviderKey = "paystack" | "stripe" | "flutterwave" | "manual";

/**
 * Stripe signs `${timestamp}.${rawBody}` with HMAC-SHA256 and sends
 * `Stripe-Signature: t=<timestamp>,v1=<signature>[,v1=...]`.
 * Rejects bodies older than `toleranceSec` so a captured request cannot be replayed later.
 */
export function verifyStripeSignature(
  rawBody: string,
  header: string,
  secret: string,
  opts: { toleranceSec?: number; now?: number } = {}
): boolean {
  if (!secret || !header) return false;
  const parts = header.split(",").map((p) => p.trim().split("="));
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v ?? "");
  if (!t || sigs.length === 0) return false;
  const tolerance = opts.toleranceSec ?? 300;
  const nowSec = Math.floor((opts.now ?? Date.now()) / 1000);
  const ts = Number(t);
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > tolerance) return false;
  const expected = hmacHex("sha256", secret, `${t}.${rawBody}`);
  return sigs.some((s) => safeEqual(expected, s));
}

/** Flutterwave sends the secret hash you chose in the dashboard, unchanged, in the `verif-hash` header. */
export function verifyFlutterwaveHash(header: string, secretHash: string): boolean {
  if (!secretHash || !header) return false;
  return safeEqual(secretHash, header);
}

/** Paystack signs the raw body with HMAC-SHA512 using the secret key. */
export function verifyPaystackSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  return safeEqual(hmacHex("sha512", secret, rawBody), signature);
}

export interface Availability {
  paystack: boolean;
  stripe: boolean;
  flutterwave: boolean;
  manual: boolean;
}

/** Providers listed in the order they should be offered for a given country (ISO 3166 alpha-2, or empty). */
const PAYSTACK_COUNTRIES = new Set(["NG", "GH", "ZA", "KE", "CI"]);
const FLUTTERWAVE_MOMO = new Set(["KE", "UG", "RW", "TZ", "GH", "MW", "ZM", "CM", "SN", "CI"]);
const EAST_AFRICA_MANUAL = new Set(["SS", "UG", "KE", "TZ", "RW", "ET", "BI", "SO"]);

export function orderProviders(country: string | undefined, available: Availability): ProviderKey[] {
  const c = (country ?? "").toUpperCase();
  const out: ProviderKey[] = [];
  if (c === "SS") {
    // South Sudan: no card or mobile-money processor covers it directly. Manual first, cards as backup.
    if (available.manual) out.push("manual");
    if (available.stripe) out.push("stripe");
    if (available.flutterwave) out.push("flutterwave");
    if (available.paystack) out.push("paystack");
    return out;
  }
  if (PAYSTACK_COUNTRIES.has(c) && available.paystack) out.push("paystack");
  if (FLUTTERWAVE_MOMO.has(c) && available.flutterwave) out.push("flutterwave");
  if (available.stripe) out.push("stripe");
  if (available.flutterwave && !out.includes("flutterwave")) out.push("flutterwave");
  if (available.paystack && !out.includes("paystack")) out.push("paystack");
  if (EAST_AFRICA_MANUAL.has(c) && available.manual && !out.includes("manual")) out.push("manual");
  else if (available.manual && out.length === 0) out.push("manual");
  return out;
}
