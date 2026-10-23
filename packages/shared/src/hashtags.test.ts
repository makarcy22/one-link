import { describe, expect, it } from "vitest";
import { pickTags, scoreHashtag, suggestHashtags, tagWords, tokenize, type TrendRef } from "./hashtags.js";

const trending: TrendRef[] = [
  { tag: "#JubaFashion", topic: "Juba street style", momentum: "rising", platforms: ["facebook", "tiktok"], regions: ["south_sudan"] },
  { tag: "#Foodie", topic: "Local food", momentum: "steady", platforms: ["facebook"], regions: ["global"] },
];

describe("tokenize and tagWords", () => {
  it("drops filler words and numbers", () => {
    expect(tokenize("The new collection is coming 2027")).toEqual(["collection"]);
  });
  it("splits camel case", () => {
    expect(tagWords("#JubaFashion")).toEqual(["juba", "fashion"]);
  });
});

describe("scoreHashtag", () => {
  const ctx = { text: "Our autumn fashion collection lands Friday", platform: "facebook", niche: "fashion", region: "south_sudan", trending };

  it("scores a tag that matches the post and niche as strong, with reasons", () => {
    const s = scoreHashtag("#Fashion", ctx);
    expect(s.tier).toBe("strong");
    expect(s.reasons.join(" ")).toMatch(/fashion/i);
  });

  it("explains trending and regional fit", () => {
    const s = scoreHashtag("#JubaFashion", ctx);
    expect(s.reasons.join(" ")).toMatch(/Rising idea/);
    expect(s.reasons.join(" ")).toMatch(/region/i);
    expect(s.score).toBeGreaterThan(scoreHashtag("#Foodie", ctx).score);
  });

  it("penalizes very broad tags and explains popularity is not fit", () => {
    const s = scoreHashtag("#fyp", ctx);
    expect(s.tier).toBe("weak");
    expect(s.cautions.join(" ")).toMatch(/Popularity is not the same as fit/);
  });

  it("keeps scores between 0 and 100", () => {
    for (const t of ["#Fashion", "#fyp", "#a", "#" + "x".repeat(40)]) {
      const s = scoreHashtag(t, ctx).score;
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });

  it("rewards tags the user saved", () => {
    const base = scoreHashtag("#MyBrandTag", { ...ctx, saved: [] });
    const saved = scoreHashtag("#MyBrandTag", { ...ctx, saved: ["#MyBrandTag"] });
    expect(saved.score).toBeGreaterThan(base.score);
  });
});

describe("suggestHashtags", () => {
  const ctx = { text: "Autumn fashion collection from Juba", platform: "facebook", niche: "Fashion", categories: ["Fashion"], region: "south_sudan", trending };

  it("returns ranked, deduplicated suggestions", () => {
    const { suggestions } = suggestHashtags(ctx, 8);
    const tags = suggestions.map((s) => s.tag.toLowerCase());
    expect(new Set(tags).size).toBe(tags.length);
    const scores = suggestions.map((s) => s.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(tags).toContain("#fashion");
  });

  it("asks for more input when there is nothing to match", () => {
    const { notes, suggestions } = suggestHashtags({ text: "", platform: "facebook" });
    expect(notes.join(" ")).toMatch(/Write your post/);
    expect(suggestions).toEqual([]);
  });

  it("limits broad tags in the list", () => {
    const { suggestions } = suggestHashtags({ ...ctx, saved: ["#fyp", "#viral", "#love"] }, 10);
    expect(suggestions.filter((s) => s.cautions.some((c) => c.startsWith("Very broad"))).length).toBeLessThanOrEqual(1);
  });

  it("pickTags returns no more than the ideal count and skips weak tags", () => {
    const sug = suggestHashtags(ctx, 10);
    const picked = pickTags(sug, "x");
    expect(picked.length).toBeLessThanOrEqual(2);
    for (const t of picked) expect(sug.suggestions.find((s) => s.tag === t)!.tier).not.toBe("weak");
  });
});

describe("suggestions stay meaningful", () => {
  it("does not invent tags from adjacent words or match on filler words", () => {
    const r = suggestHashtags({ text: "Something new lands Friday. Here is a first look at the autumn jackets, cut and sewn in Juba.", platform: "facebook", niche: "Fashion" }, 12);
    const tags = r.suggestions.map((s) => s.tag.toLowerCase());
    expect(tags).not.toContain("#landsfriday");
    expect(tags).not.toContain("#somethinglands");
    expect(tags.some((t) => t.includes("learnsomething"))).toBe(false);
    expect(tags).toContain("#autumn");
  });
});
