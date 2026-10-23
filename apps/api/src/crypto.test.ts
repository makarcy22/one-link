import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptToken, encryptToken } from "./crypto.js";

describe("token vault", () => {
  const original = process.env.SOCIAL_TOKEN_KEY;
  beforeEach(() => {
    process.env.SOCIAL_TOKEN_KEY = randomBytes(32).toString("base64");
  });
  afterEach(() => {
    if (original === undefined) delete process.env.SOCIAL_TOKEN_KEY;
    else process.env.SOCIAL_TOKEN_KEY = original;
  });

  it("round-trips a token", () => {
    expect(decryptToken(encryptToken("access-token-123"))).toBe("access-token-123");
  });
  it("uses a fresh nonce each time", () => {
    expect(encryptToken("same")).not.toBe(encryptToken("same"));
  });
  it("fails to decrypt tampered data", () => {
    const buf = Buffer.from(encryptToken("secret"), "base64");
    buf[buf.length - 1] ^= 0xff;
    expect(() => decryptToken(buf.toString("base64"))).toThrow();
  });
  it("refuses a key of the wrong length", () => {
    process.env.SOCIAL_TOKEN_KEY = Buffer.from("too short").toString("base64");
    expect(() => encryptToken("x")).toThrow(/32 bytes/);
  });
});
