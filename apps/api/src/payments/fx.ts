// Automatic local prices from a live exchange rate, based on the person's country.
// Rates come from a public feed (default: open.er-api.com, free, updated about once a day) and are cached.
// The owner can always override a price in LOCAL_PRICES, and can add a safety margin with FX_MARGIN_PERCENT.
import { COUNTRY_CURRENCY, type LocalPrices, type PaidPlan } from "./currency.js";

export interface Rates {
  /** Units of each currency per 1 US dollar. */
  rates: Record<string, number>;
  /** When the feed says it last updated, as an ISO date. */
  asOf: string;
  source: string;
}

export const DEFAULT_FX_URL = "https://open.er-api.com/v6/latest/USD";
export const FX_ATTRIBUTION = { text: "Rates by Exchange Rate API", url: "https://www.exchangerate-api.com" };

/** Reads the feed's JSON. Returns null for anything unexpected, so a bad feed never produces a bad price. */
export function parseRates(json: unknown, source = DEFAULT_FX_URL): Rates | null {
  const j = json as { result?: string; base_code?: string; rates?: Record<string, unknown>; time_last_update_utc?: string } | null;
  if (!j || j.result !== "success" || (j.base_code && j.base_code !== "USD") || !j.rates) return null;
  const rates: Record<string, number> = {};
  for (const [k, v] of Object.entries(j.rates)) {
    const n = Number(v);
    if (/^[A-Z]{3}$/.test(k) && Number.isFinite(n) && n > 0) rates[k] = n;
  }
  if (!rates.USD) rates.USD = 1;
  const d = j.time_last_update_utc ? new Date(j.time_last_update_utc) : new Date();
  return { rates, asOf: (Number.isNaN(d.getTime()) ? new Date() : d).toISOString(), source };
}

/** Rounds UP to a tidy amount: about two significant digits (86,265 becomes 87,000; 1,947 becomes 2,000). */
export function niceRound(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const step = Math.max(1, 10 ** (Math.floor(Math.log10(amount)) - 1));
  return Math.ceil(amount / step) * step;
}

/** Local price for a US dollar price, with the owner's safety margin. */
export function convertUsd(usd: number, rate: number, marginPercent = 0): number {
  return niceRound(usd * rate * (1 + Math.max(0, marginPercent) / 100));
}

export interface Fetcher {
  (url: string, init?: { signal?: AbortSignal }): Promise<{ ok: boolean; json(): Promise<unknown> }>;
}

const HOUR = 3600_000;
let cache: { at: number; value: Rates } | null = null;

/**
 * Current rates. Cached for 6 hours. If the feed is down, the last good rates are used for up to 7 days,
 * after that null (the app then offers dollars only, never a stale guess).
 */
export async function getRates(opts: { fetch?: Fetcher; now?: number; url?: string } = {}): Promise<Rates | null> {
  const now = opts.now ?? Date.now();
  const url = opts.url ?? (process.env.FX_URL || DEFAULT_FX_URL);
  if (cache && now - cache.at < 6 * HOUR) return cache.value;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await (opts.fetch ?? (fetch as unknown as Fetcher))(url, { signal: ctrl.signal });
    clearTimeout(t);
    const parsed = res.ok ? parseRates(await res.json(), url) : null;
    if (parsed) {
      cache = { at: now, value: parsed };
      return parsed;
    }
  } catch {
    /* fall through to the last good rates */
  }
  if (cache && now - cache.at < 7 * 24 * HOUR) return cache.value;
  return null;
}
export function resetRatesCache() { cache = null; }

export interface AutoPrice { code: string; creator: number; business: number; asOf: string }

/** Prices in the currency of the person's country, from the live rate. Null when the rate is not known. */
export function autoLocalPrice(
  country: string | undefined,
  usd: Record<PaidPlan, number>,
  rates: Rates | null,
  marginPercent = 0
): AutoPrice | null {
  const code = COUNTRY_CURRENCY[(country ?? "").toUpperCase()];
  const rate = code ? rates?.rates[code] : undefined;
  if (!code || !rate || !rates) return null;
  return { code, creator: convertUsd(usd.creator, rate, marginPercent), business: convertUsd(usd.business, rate, marginPercent), asOf: rates.asOf };
}

/** Owner prices win. A live price fills in only when the owner set none for that currency. */
export function mergePrices(fixed: LocalPrices, auto: AutoPrice | null): { prices: LocalPrices; estimated: Record<string, string> } {
  const prices: LocalPrices = { ...fixed };
  const estimated: Record<string, string> = {};
  if (auto && !prices[auto.code]) {
    prices[auto.code] = { creator: auto.creator, business: auto.business };
    estimated[auto.code] = auto.asOf;
  }
  return { prices, estimated };
}
