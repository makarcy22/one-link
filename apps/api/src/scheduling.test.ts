import { describe, expect, it } from "vitest";
import { delayUntil, jobKey, parsePlatforms, parseWhen } from "./scheduling.js";

describe("parsePlatforms", () => {
  it("accepts a JSON string like the Planner sends", () => {
    expect(parsePlatforms('["tiktok","Instagram"]')).toEqual(["tiktok", "instagram"]);
  });
  it("accepts a real array", () => {
    expect(parsePlatforms(["x", "linkedin"])).toEqual(["x", "linkedin"]);
  });
  it("drops unknown platforms, duplicates and non-strings", () => {
    expect(parsePlatforms(["tiktok", "TikTok", "myspace", 5, null])).toEqual(["tiktok"]);
  });
  it("returns an empty list for garbage", () => {
    expect(parsePlatforms("not json")).toEqual([]);
    expect(parsePlatforms(undefined)).toEqual([]);
    expect(parsePlatforms({ a: 1 })).toEqual([]);
  });
});

describe("parseWhen", () => {
  it("parses an ISO date", () => {
    expect(parseWhen("2026-12-01T10:00:00.000Z")?.toISOString()).toBe("2026-12-01T10:00:00.000Z");
  });
  it("rejects invalid input", () => {
    expect(parseWhen("tomorrow-ish")).toBeNull();
    expect(parseWhen(undefined)).toBeNull();
    expect(parseWhen({})).toBeNull();
  });
});

describe("delayUntil", () => {
  it("returns the wait in milliseconds", () => {
    const now = Date.parse("2026-12-01T10:00:00Z");
    expect(delayUntil(new Date("2026-12-01T10:00:30Z"), now)).toBe(30_000);
  });
  it("never goes negative for a time in the past", () => {
    const now = Date.parse("2026-12-01T10:00:00Z");
    expect(delayUntil(new Date("2026-11-01T00:00:00Z"), now)).toBe(0);
  });
});

describe("jobKey", () => {
  it("has no colon, which BullMQ forbids in custom ids", () => {
    expect(jobKey("abc-123")).toBe("publish-abc-123");
    expect(jobKey("abc-123")).not.toContain(":");
  });
});
