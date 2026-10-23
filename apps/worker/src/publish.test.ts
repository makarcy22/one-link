import { describe, expect, it } from "vitest";
import { composeText, parseList } from "./publish.js";

describe("composeText", () => {
  it("puts hashtags after the caption and skips empty parts", () => {
    expect(composeText("Hello", ["#a", "#b"])).toBe("Hello\n\n#a #b");
    expect(composeText("  Hello  ", [])).toBe("Hello");
  });
});
describe("parseList", () => {
  it("reads stored JSON lists and ignores bad data", () => {
    expect(parseList('["#a","#b"]')).toEqual(["#a", "#b"]);
    expect(parseList("not json")).toEqual([]);
    expect(parseList('{"a":1}')).toEqual([]);
    expect(parseList('[1,"#x"]')).toEqual(["#x"]);
  });
});
