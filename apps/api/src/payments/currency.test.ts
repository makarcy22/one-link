import { describe, expect, it } from "vitest";
import { amountFor, currencyOptions, parseLocalPrices } from "./currency.js";

const usd = { creator: 15, business: 49 };
const local = parseLocalPrices('{"ssp":{"creator":9000,"business":30000},"UGX":{"creator":55000,"business":180000},"KES":{"creator":1900}}');

describe("parseLocalPrices", () => {
  it("keeps complete rows and ignores broken ones", () => {
    expect(Object.keys(local).sort()).toEqual(["SSP", "UGX"]);
    expect(parseLocalPrices("not json")).toEqual({});
    expect(parseLocalPrices(undefined)).toEqual({});
    expect(parseLocalPrices('{"XX":{"creator":1,"business":2}}')).toEqual({});
  });
});
describe("currencyOptions", () => {
  it("always offers dollars, then the person's own money first", () => {
    const o = currencyOptions("manual", usd, local, "SS");
    expect(o.map((x) => x.code)).toEqual(["USD", "SSP", "UGX"]);
  });
  it("offers only what the method can take", () => {
    expect(currencyOptions("flutterwave", usd, local, "SS").map((x) => x.code)).toEqual(["USD", "UGX"]);
    expect(currencyOptions("stripe", usd, local, "UG").map((x) => x.code)).toEqual(["USD"]);
  });
  it("offers dollars only when no local price is set", () => {
    expect(currencyOptions("manual", usd, {}, "SS").map((x) => x.code)).toEqual(["USD"]);
  });
});
describe("amountFor", () => {
  it("returns the configured amount, never a converted one", () => {
    expect(amountFor("manual", "USD", "creator", usd, local)).toBe(15);
    expect(amountFor("manual", "ssp", "business", usd, local)).toBe(30000);
  });
  it("refuses a currency the method or owner does not offer", () => {
    expect(amountFor("stripe", "SSP", "creator", usd, local)).toBeNull();
    expect(amountFor("flutterwave", "SSP", "creator", usd, local)).toBeNull();
    expect(amountFor("manual", "KES", "creator", usd, local)).toBeNull();
  });
});
