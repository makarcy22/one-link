import { describe, expect, it } from "vitest";
import { checkAvatar, checkName, MAX_AVATAR_CHARS } from "./avatar.js";

describe("avatar rules", () => {
  it("accepts a small jpeg data URL, an https address, and removal", () => {
    expect(checkAvatar("data:image/jpeg;base64,/9j/4AAQSkZJRg==").ok).toBe(true);
    expect(checkAvatar("https://cdn.example.com/a.png").ok).toBe(true);
    expect(checkAvatar(null).ok).toBe(true);
    expect(checkAvatar("").ok).toBe(true);
  });
  it("rejects scripts, svg, http, other types and oversized pictures", () => {
    expect(checkAvatar("javascript:alert(1)").ok).toBe(false);
    expect(checkAvatar("data:image/svg+xml;base64,PHN2Zz4=").ok).toBe(false);
    expect(checkAvatar("http://insecure.example.com/a.png").ok).toBe(false);
    expect(checkAvatar(42).ok).toBe(false);
    expect(checkAvatar("data:image/jpeg;base64," + "A".repeat(MAX_AVATAR_CHARS)).ok).toBe(false);
  });
  it("cleans and limits names", () => {
    expect(checkName("  Amira   Deng ")).toEqual({ ok: true, name: "Amira Deng" });
    expect(checkName("   ").ok).toBe(false);
    expect(checkName("x".repeat(81)).ok).toBe(false);
    expect(checkName(7).ok).toBe(false);
  });
});
