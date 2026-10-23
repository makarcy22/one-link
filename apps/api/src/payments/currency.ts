// Dollars or local money. Pure helpers, no network or database.
// The owner sets local prices in LOCAL_PRICES (JSON). One Link never converts currencies by itself,
// because a made-up exchange rate would charge people the wrong amount.
//   LOCAL_PRICES={"SSP":{"creator":<amount>,"business":<amount>},"UGX":{...}}

export type PaidPlan = "creator" | "business";
export type LocalPrices = Record<string, Partial<Record<PaidPlan, number>>>;

export const CURRENCY_NAMES: Record<string, string> = {
  USD: "US dollars", SSP: "South Sudanese pounds", UGX: "Ugandan shillings", KES: "Kenyan shillings",
  TZS: "Tanzanian shillings", RWF: "Rwandan francs", ETB: "Ethiopian birr", NGN: "Nigerian naira",
  GHS: "Ghanaian cedis", ZAR: "South African rand",
};

/** The money people in a country normally use. */
export const COUNTRY_CURRENCY: Record<string, string> = {
  SS: "SSP", UG: "UGX", KE: "KES", TZ: "TZS", RW: "RWF", ET: "ETB", NG: "NGN", GH: "GHS", ZA: "ZAR",
};

/** Currencies each payment route can really take. Stripe stays dollars only. */
export const PROVIDER_CURRENCIES: Record<string, string[]> = {
  manual: ["SSP", "UGX", "KES", "TZS", "RWF", "ETB", "NGN", "GHS", "ZAR"],
  flutterwave: ["UGX", "KES", "TZS", "RWF", "NGN", "GHS", "ZAR"],
  stripe: [],
  paystack: [],
};

export function parseLocalPrices(raw: string | undefined): LocalPrices {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as Record<string, Record<string, unknown>>;
    const out: LocalPrices = {};
    for (const [cur, plans] of Object.entries(v ?? {})) {
      const code = cur.toUpperCase();
      if (!/^[A-Z]{3}$/.test(code) || typeof plans !== "object" || !plans) continue;
      const row: Partial<Record<PaidPlan, number>> = {};
      for (const p of ["creator", "business"] as const) {
        const n = Number(plans[p]);
        if (Number.isFinite(n) && n > 0) row[p] = n;
      }
      if (row.creator && row.business) out[code] = row;
    }
    return out;
  } catch {
    return {};
  }
}

export interface CurrencyOption {
  code: string;
  label: string;
  creator: number;
  business: number;
}

/**
 * What a person can choose after picking a payment method: always dollars,
 * plus their own money when the owner set a price for it and the method can take it.
 */
export function currencyOptions(
  provider: string,
  usd: { creator: number; business: number },
  local: LocalPrices,
  country?: string
): CurrencyOption[] {
  const out: CurrencyOption[] = [{ code: "USD", label: CURRENCY_NAMES.USD, creator: usd.creator, business: usd.business }];
  const allowed = PROVIDER_CURRENCIES[provider] ?? [];
  const mine = COUNTRY_CURRENCY[(country ?? "").toUpperCase()];
  const codes = Object.keys(local).filter((c) => allowed.includes(c));
  // Their own currency first, then any other the owner enabled.
  codes.sort((a, b) => (a === mine ? -1 : b === mine ? 1 : a.localeCompare(b)));
  for (const c of codes) {
    out.push({ code: c, label: CURRENCY_NAMES[c] ?? c, creator: local[c].creator!, business: local[c].business! });
  }
  return out;
}

/** Amount to charge for a plan in a currency, or null when that currency is not offered for this method. */
export function amountFor(
  provider: string,
  currency: string,
  plan: PaidPlan,
  usd: { creator: number; business: number },
  local: LocalPrices
): number | null {
  const cur = currency.toUpperCase();
  if (cur === "USD") return usd[plan];
  if (!(PROVIDER_CURRENCIES[provider] ?? []).includes(cur)) return null;
  return local[cur]?.[plan] ?? null;
}
