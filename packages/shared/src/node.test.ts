import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptToken, encryptToken, hmacHex, safeEqual } from "./node.js";

describe("token vault", () => {
  const original = process.env.SOCIAL_TOKEN_KEY;
  beforeEach(() => {
    process.env.SOCIAL_TOKEN_KEY = randomBytes(32).toString("base64");
  });
  afterEach(() => {
    if (original === undefined) delete process.env.SOCIAL_TOKEN_KEY;
    else process.env.SOCIAL_TOKEN_KEY = original;
  });
  it("round-trips and uses a fresh nonce", () => {
    expect(decryptToken(encryptToken("tok"))).toBe("tok");
    expect(encryptToken("same")).not.toBe(encryptToken("same"));
  });
  it("rejects tampering and a wrong-length key", () => {
    const buf = Buffer.from(encryptToken("secret"), "base64");
    buf[buf.length - 1] ^= 0xff;
    expect(() => decryptToken(buf.toString("base64"))).toThrow();
    process.env.SOCIAL_TOKEN_KEY = "short";
    expect(() => encryptToken("x")).toThrow(/32 bytes/);
  });
});

describe("safeEqual and hmacHex", () => {
  it("compares strings in constant time and handles length differences", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
  it("matches a known HMAC-SHA256 value", () => {
    expect(hmacHex("sha256", "key", "The quick brown fox jumps over the lazy dog")).toBe(
      "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8"
    );
  });
});
