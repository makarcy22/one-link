import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyWebhook } from "./billing.js";

const SECRET = "test-secret-not-real";
const body = JSON.stringify({ event: "charge.success", data: { metadata: { userId: "u1" } } });
const sign = (b: string, secret = SECRET) => createHmac("sha512", secret).update(b).digest("hex");

describe("verifyWebhook", () => {
  const original = process.env.PAYSTACK_SECRET_KEY;
  beforeEach(() => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
  });
  afterEach(() => {
    if (original === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = original;
  });

  it("accepts a correctly signed body", () => {
    expect(verifyWebhook(body, sign(body))).toBe(true);
  });
  it("rejects a body that was changed after signing", () => {
    expect(verifyWebhook(body + " ", sign(body))).toBe(false);
  });
  it("rejects a signature made with another secret", () => {
    expect(verifyWebhook(body, sign(body, "other"))).toBe(false);
  });
  it("rejects a missing or wrong-length signature without throwing", () => {
    expect(verifyWebhook(body, "")).toBe(false);
    expect(verifyWebhook(body, "abc")).toBe(false);
  });
  it("rejects everything when no secret is configured", () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    expect(verifyWebhook(body, sign(body))).toBe(false);
  });
});
