import { beforeEach, describe, expect, it } from "vitest";
import { autoLocalPrice, convertUsd, getRates, mergePrices, niceRound, parseRates, resetRatesCache } from "./fx.js";

const feed = { result: "success", base_code: "USD", time_last_update_utc: "Mon, 12 Oct 2026 23:57:31 +0000", rates: { USD: 1, SSP: 5751, UGX: 4005, KES: 129.69, BAD: -1, XX: 2 } };

describe("parseRates", () => {
  it("accepts a good feed and drops bad entries", () => {
    const r = parseRates(feed)!;
    expect(r.rates.SSP).toBe(5751);
    expect(r.rates.BAD).toBeUndefined();
    expect(r.rates.XX).toBeUndefined();
    expect(r.asOf.startsWith("2026-10-12")).toBe(true);
  });
  it("rejects anything unexpected", () => {
    expect(parseRates(null)).toBeNull();
    expect(parseRates({ result: "error" })).toBeNull();
    expect(parseRates({ ...feed, base_code: "EUR" })).toBeNull();
    expect(parseRates({ result: "success" })).toBeNull();
  });
});
describe("rounding and conversion", () => {
  it("rounds up to a tidy amount", () => {
    expect(niceRound(86265)).toBe(87000);
    expect(niceRound(1947)).toBe(2000);
    expect(niceRound(1.4)).toBe(2);
    expect(niceRound(0)).toBe(0);
  });
  it("adds the margin before rounding and never goes below the plain price", () => {
    expect(convertUsd(15, 5751)).toBe(87000);
    expect(convertUsd(15, 5751, 5)).toBeGreaterThanOrEqual(convertUsd(15, 5751));
    expect(convertUsd(15, 5751, -50)).toBe(convertUsd(15, 5751));
  });
});
describe("autoLocalPrice and mergePrices", () => {
  const rates = parseRates(feed);
  const usd = { creator: 15, business: 49 };
  it("prices in the currency of the person's country", () => {
    const a = autoLocalPrice("ss", usd, rates)!;
    expect(a.code).toBe("SSP");
    expect(a.business).toBe(convertUsd(49, 5751));
  });
  it("gives nothing for an unknown country, a missing rate, or no feed", () => {
    expect(autoLocalPrice("US", usd, rates)).toBeNull();
    expect(autoLocalPrice("ET", usd, rates)).toBeNull();
    expect(autoLocalPrice("SS", usd, null)).toBeNull();
  });
  it("lets the owner's fixed price win", () => {
    const a = autoLocalPrice("SS", usd, rates);
    const m = mergePrices({ SSP: { creator: 9000, business: 30000 } }, a);
    expect(m.prices.SSP.creator).toBe(9000);
    expect(m.estimated.SSP).toBeUndefined();
    const m2 = mergePrices({}, a);
    expect(m2.estimated.SSP).toBeDefined();
  });
});
describe("getRates cache", () => {
  beforeEach(resetRatesCache);
  const ok = async () => ({ ok: true, json: async () => feed });
  const down = async () => { throw new Error("offline"); };
  it("uses the cache, then the last good rates when the feed is down, then nothing after a week", async () => {
    const t0 = 1_800_000_000_000;
    expect((await getRates({ fetch: ok, now: t0 }))?.rates.SSP).toBe(5751);
    let calls = 0;
    const counting = async () => { calls++; return ok(); };
    await getRates({ fetch: counting, now: t0 + 3600_000 });
    expect(calls).toBe(0);
    expect((await getRates({ fetch: down, now: t0 + 24 * 3600_000 }))?.rates.SSP).toBe(5751);
    expect(await getRates({ fetch: down, now: t0 + 8 * 24 * 3600_000 })).toBeNull();
  });
  it("ignores a bad feed", async () => {
    expect(await getRates({ fetch: async () => ({ ok: true, json: async () => ({ result: "error" }) }), now: 1 })).toBeNull();
  });
});
