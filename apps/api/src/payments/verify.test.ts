import { describe, expect, it } from "vitest";
import { hmacHex } from "@one-link/shared/node";
import { orderProviders, verifyFlutterwaveHash, verifyPaystackSignature, verifyStripeSignature } from "./verify.js";

const body = '{"id":"evt_1","type":"checkout.session.completed"}';

describe("verifyStripeSignature", () => {
  const secret = "whsec_test_not_real";
  const now = 1_800_000_000_000;
  const t = Math.floor(now / 1000);
  const header = (b = body, ts = t) => `t=${ts},v1=${hmacHex("sha256", secret, `${ts}.${b}`)}`;

  it("accepts a fresh, correctly signed body", () => {
    expect(verifyStripeSignature(body, header(), secret, { now })).toBe(true);
  });
  it("rejects a changed body", () => {
    expect(verifyStripeSignature(body + " ", header(), secret, { now })).toBe(false);
  });
  it("rejects an old timestamp (replay)", () => {
    expect(verifyStripeSignature(body, header(body, t - 3600), secret, { now })).toBe(false);
  });
  it("rejects a wrong secret, a missing header and missing secret", () => {
    expect(verifyStripeSignature(body, header(), "other", { now })).toBe(false);
    expect(verifyStripeSignature(body, "", secret, { now })).toBe(false);
    expect(verifyStripeSignature(body, header(), "", { now })).toBe(false);
  });
  it("accepts when any of several v1 signatures matches", () => {
    const h = `t=${t},v1=deadbeef,v1=${hmacHex("sha256", secret, `${t}.${body}`)}`;
    expect(verifyStripeSignature(body, h, secret, { now })).toBe(true);
  });
});

describe("verifyFlutterwaveHash", () => {
  it("matches only the exact hash", () => {
    expect(verifyFlutterwaveHash("abc123", "abc123")).toBe(true);
    expect(verifyFlutterwaveHash("abc124", "abc123")).toBe(false);
    expect(verifyFlutterwaveHash("", "abc123")).toBe(false);
    expect(verifyFlutterwaveHash("abc123", "")).toBe(false);
  });
});

describe("verifyPaystackSignature", () => {
  it("checks the HMAC-SHA512 of the raw body", () => {
    const sig = hmacHex("sha512", "k", body);
    expect(verifyPaystackSignature(body, sig, "k")).toBe(true);
    expect(verifyPaystackSignature(body + "x", sig, "k")).toBe(false);
    expect(verifyPaystackSignature(body, "", "k")).toBe(false);
  });
});

describe("orderProviders", () => {
  const all = { paystack: true, stripe: true, flutterwave: true, manual: true };
  it("offers manual mobile money first in South Sudan", () => {
    expect(orderProviders("SS", all)[0]).toBe("manual");
  });
  it("offers Flutterwave mobile money first in Uganda, with Stripe behind it", () => {
    const o = orderProviders("UG", all);
    expect(o[0]).toBe("flutterwave");
    expect(o).toContain("stripe");
  });
  it("offers Paystack first in Nigeria", () => {
    expect(orderProviders("NG", all)[0]).toBe("paystack");
  });
  it("offers Stripe first elsewhere", () => {
    expect(orderProviders("US", all)[0]).toBe("stripe");
    expect(orderProviders(undefined, all)[0]).toBe("stripe");
  });
  it("only returns what is configured", () => {
    expect(orderProviders("US", { paystack: false, stripe: false, flutterwave: false, manual: false })).toEqual([]);
    expect(orderProviders("SS", { paystack: false, stripe: true, flutterwave: false, manual: false })).toEqual(["stripe"]);
  });
});

import { makeTxRef, parseTxRef } from "./flutterwave-ref.js";
describe("tx_ref", () => {
  it("round-trips plan and user id, even when the id contains dashes", () => {
    const ref = makeTxRef("creator", "usr-1234-abcd", 1700000000000);
    expect(parseTxRef(ref)).toEqual({ plan: "creator", userId: "usr-1234-abcd" });
  });
  it("rejects references that are not ours", () => {
    expect(parseTxRef("other-ref")).toBeNull();
    expect(parseTxRef("ol-creator-1")).toBeNull();
  });
});
