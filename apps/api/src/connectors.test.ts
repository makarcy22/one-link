import { describe, expect, it } from "vitest";
import { canAutoPublish, platformMode } from "./connectors.js";

describe("platformMode", () => {
  it("only Facebook posts by itself for now", () => {
    expect(platformMode("facebook")).toBe("direct");
    expect(canAutoPublish("facebook")).toBe(true);
  });
  it("other networks are connect-now, post-later, and never claim success", () => {
    for (const p of ["tiktok", "instagram", "linkedin", "x"]) {
      expect(platformMode(p)).toBe("soon");
      expect(canAutoPublish(p)).toBe(false);
    }
  });
  it("treats WhatsApp and unknown platforms as manual", () => {
    expect(platformMode("whatsapp")).toBe("manual");
    expect(platformMode("somewhere-new")).toBe("manual");
  });
  it("is case-insensitive", () => {
    expect(platformMode("Facebook")).toBe("direct");
  });
});
