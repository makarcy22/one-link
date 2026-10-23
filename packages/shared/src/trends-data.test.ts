import { describe, expect, it } from "vitest";
import { CATEGORIES, EVENTS, TRENDS, filterTrends, rankTrends, upcomingEvents } from "./trends-data.js";
import { PLATFORM_KEYS } from "./platforms.js";

describe("curated trends", () => {
  it("every trend is complete and uses known values", () => {
    const ids = new Set<string>();
    for (const t of TRENDS) {
      expect(ids.has(t.id)).toBe(false);
      ids.add(t.id);
      expect(CATEGORIES).toContain(t.category);
      expect(t.platforms.length).toBeGreaterThan(0);
      for (const p of t.platforms) expect(PLATFORM_KEYS).toContain(p);
      expect(t.hashtags.length).toBeGreaterThan(0);
      for (const h of t.hashtags) expect(h.startsWith("#")).toBe(true);
      expect(t.why.length).toBeGreaterThan(10);
      expect(t.hook.length).toBeGreaterThan(5);
    }
  });

  it("filters by platform, category and text", () => {
    expect(filterTrends({ platform: "linkedin" }).every((t) => t.platforms.includes("linkedin"))).toBe(true);
    expect(filterTrends({ category: "fashion" }).every((t) => t.category === "Fashion")).toBe(true);
    expect(filterTrends({ q: "juba" }).length).toBeGreaterThan(0);
    expect(filterTrends({ platform: "all", category: "all", region: "all" })).toHaveLength(TRENDS.length);
  });

  it("a region filter keeps that region and global trends", () => {
    const ss = filterTrends({ region: "south_sudan" });
    expect(ss.some((t) => t.regions.includes("south_sudan"))).toBe(true);
    expect(ss.every((t) => t.regions.includes("south_sudan") || t.regions.includes("global"))).toBe(true);
    expect(ss.some((t) => t.id === "east-africa-music")).toBe(true);
    expect(filterTrends({ region: "west_africa" }).some((t) => t.id === "street-style-juba")).toBe(false);
  });

  it("ranks the user's niche first", () => {
    const ranked = rankTrends(TRENDS, { categories: ["Food"] });
    expect(ranked[0].category).toBe("Food");
  });
});

describe("calendar events", () => {
  it("has valid dates in order of use", () => {
    for (const e of EVENTS) expect(Number.isNaN(Date.parse(`${e.date}T00:00:00Z`))).toBe(false);
  });
  it("finds events in the next 60 days only", () => {
    const out = upcomingEvents(new Date("2026-10-13T08:00:00Z"), 60);
    expect(out.map((e) => e.name)).toContain("Black Friday");
    expect(out.map((e) => e.name)).not.toContain("Easter Sunday");
    const dates = out.map((e) => e.date);
    expect([...dates].sort()).toEqual(dates);
  });
  it("limits by region plus global", () => {
    const out = upcomingEvents(new Date("2027-06-20T00:00:00Z"), 30, "south_sudan");
    expect(out.map((e) => e.name)).toEqual(["South Sudan Independence Day"]);
    expect(upcomingEvents(new Date("2026-10-01T00:00:00Z"), 30, "south_sudan").map((e) => e.name)).not.toContain("Uganda Independence Day");
  });
  it("Black Friday 2026 is a Friday", () => {
    expect(new Date("2026-11-27T00:00:00Z").getUTCDay()).toBe(5);
  });
});
