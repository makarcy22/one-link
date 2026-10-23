import { describe, expect, it } from "vitest";
import { adaptAll, adaptForPlatform, countChars, normalizeHashtag, normalizeHashtags, shorten } from "./adapt.js";

describe("hashtag normalizing", () => {
  it("adds one # and removes junk", () => {
    expect(normalizeHashtag("  ##Juba Fashion! ")).toBe("#JubaFashion");
    expect(normalizeHashtag("###")).toBe("");
  });
  it("removes duplicates ignoring case", () => {
    expect(normalizeHashtags(["#Style", "style", "#STYLE", "#Fashion"])).toEqual(["#Style", "#Fashion"]);
  });
  it("keeps non-English letters", () => {
    expect(normalizeHashtag("#مرحبا")).toBe("#مرحبا");
  });
});

describe("countChars", () => {
  it("counts emoji as one character", () => {
    expect(countChars("hi 🎉")).toBe(4);
  });
});

describe("shorten", () => {
  it("cuts at a word boundary and adds an ellipsis", () => {
    const out = shorten("The quick brown fox jumps over the lazy dog again and again", 30);
    expect(countChars(out)).toBeLessThanOrEqual(30);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });
  it("leaves short text alone", () => {
    expect(shorten("short", 30)).toBe("short");
  });
});

describe("adaptForPlatform", () => {
  it("returns null for unknown platforms", () => {
    expect(adaptForPlatform({ text: "hi", platform: "myspace" })).toBeNull();
  });

  it("blocks an empty post", () => {
    const v = adaptForPlatform({ text: "   ", platform: "facebook" })!;
    expect(v.blockers.join(" ")).toMatch(/empty/i);
  });

  it("assembles caption, link and hashtags", () => {
    const v = adaptForPlatform({ text: "New drop", platform: "facebook", hashtags: ["fashion", "#Style"], link: "https://example.com" })!;
    expect(v.final).toBe("New drop\n\nhttps://example.com\n\n#fashion #Style");
    expect(v.blockers).toEqual([]);
  });

  it("shortens long text for X and keeps hashtags", () => {
    const long = "word ".repeat(100);
    const v = adaptForPlatform({ text: long, platform: "x", hashtags: ["#One"] })!;
    expect(v.chars).toBeLessThanOrEqual(280);
    expect(v.fits).toBe(true);
    expect(v.final.endsWith("#One")).toBe(true);
    expect(v.warnings.join(" ")).toMatch(/Shortened/);
  });

  it("counts a link as 23 characters on X", () => {
    const withLink = adaptForPlatform({ text: "Check this out", platform: "x", link: "https://example.com/a/very/long/path/that/goes/on/and/on/forever/and/ever" })!;
    expect(withLink.chars).toBe(countChars("Check this out") + 2 + 23);
  });

  it("drops hashtags for WhatsApp and says so", () => {
    const v = adaptForPlatform({ text: "Hello", platform: "whatsapp", hashtags: ["#a1"] })!;
    expect(v.hashtags).toEqual([]);
    expect(v.warnings.join(" ")).toMatch(/hashtags/);
  });

  it("warns instead of cutting when hashtags are above the ideal range but allowed", () => {
    const tags = ["#a1", "#b2", "#c3", "#d4", "#e5", "#f6"];
    const v = adaptForPlatform({ text: "Hello", platform: "instagram", hashtags: tags, media: "image" })!;
    expect(v.hashtags).toHaveLength(6);
    expect(v.warnings.join(" ")).toMatch(/more than the 3–5/);
  });

  it("cuts hashtags above the hard limit", () => {
    const tags = Array.from({ length: 8 }, (_, i) => `#tag${i}`);
    const v = adaptForPlatform({ text: "Hello", platform: "x", hashtags: tags })!;
    expect(v.hashtags).toHaveLength(5);
  });

  it("needs video for TikTok and media for Instagram", () => {
    expect(adaptForPlatform({ text: "hi", platform: "tiktok" })!.blockers.join(" ")).toMatch(/video/);
    expect(adaptForPlatform({ text: "hi", platform: "tiktok", media: "image" })!.blockers.length).toBeGreaterThan(0);
    expect(adaptForPlatform({ text: "hi", platform: "tiktok", media: "video" })!.blockers).toEqual([]);
    expect(adaptForPlatform({ text: "hi", platform: "instagram" })!.blockers.join(" ")).toMatch(/image or a video/);
  });

  it("tells the user when a platform is manual or not available yet", () => {
    expect(adaptForPlatform({ text: "hi", platform: "whatsapp" })!.warnings.join(" ")).toMatch(/cannot post here/);
    expect(adaptForPlatform({ text: "hi", platform: "linkedin" })!.warnings.join(" ")).toMatch(/not available yet/);
    expect(adaptForPlatform({ text: "hi", platform: "facebook" })!.warnings.join(" ")).not.toMatch(/not available/);
  });

  it("warns about Facebook posts that will be folded", () => {
    const v = adaptForPlatform({ text: "x".repeat(600), platform: "facebook" })!;
    expect(v.warnings.join(" ")).toMatch(/See more/);
    expect(v.fits).toBe(true);
  });
});

describe("adaptAll", () => {
  it("returns one variant per known platform, once", () => {
    const out = adaptAll("Hello", ["facebook", "Facebook", "x", "nope"]);
    expect(out.map((v) => v.platform)).toEqual(["facebook", "x"]);
  });
});
