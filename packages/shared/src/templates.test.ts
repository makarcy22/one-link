import { describe, expect, it } from "vitest";
import { CAPTION_STARTERS, GRAPHIC_TEMPLATES, THEMES, escapeXml, fillCaption, renderTemplate, wrapLines } from "./templates.js";

describe("wrapLines", () => {
  it("wraps at word boundaries and respects the maximum", () => {
    const rows = wrapLines("one two three four five six seven eight nine ten", 10, 3);
    expect(rows).toHaveLength(3);
    expect(rows[2].endsWith("…")).toBe(true);
    for (const r of rows.slice(0, 2)) expect(r.length).toBeLessThanOrEqual(10);
  });
  it("keeps explicit line breaks", () => {
    expect(wrapLines("a\nb", 20)).toEqual(["a", "b"]);
  });
});

describe("renderTemplate", () => {
  it("renders every template with every theme as valid-looking SVG with the right size", () => {
    for (const tpl of GRAPHIC_TEMPLATES) {
      for (const theme of THEMES) {
        const svg = renderTemplate(tpl.id, {}, theme.id);
        expect(svg.startsWith("<svg")).toBe(true);
        expect(svg.endsWith("</svg>")).toBe(true);
        expect(svg).toContain(`width="${tpl.width}"`);
        expect(svg).toContain(`height="${tpl.height}"`);
        expect(svg).toContain(`fill="${theme.bg}"`);
      }
    }
  });
  it("escapes user text so it cannot inject markup", () => {
    const svg = renderTemplate("announcement", { headline: `<script>alert("x")</script> & more` }, "bold");
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("&amp; more");
  });
  it("uses the user's text and trims it to the field limit", () => {
    const svg = renderTemplate("sale", { offer: "50% OFF TODAY ONLY!!!" }, "paper");
    expect(svg).toContain("50% OFF TODAY");
    expect(svg).not.toContain("ONLY!!!");
  });
  it("falls back to the first template and theme for unknown ids", () => {
    expect(renderTemplate("nope", {}, "nope")).toContain('aria-label="Announcement"');
  });
  it("escapeXml handles quotes", () => {
    expect(escapeXml(`"a" & 'b'`)).toBe("&quot;a&quot; &amp; &#39;b&#39;");
  });
});

describe("caption starters", () => {
  it("fills values and keeps placeholders for missing ones", () => {
    const s = CAPTION_STARTERS.find((x) => x.id === "launch")!;
    const out = fillCaption(s, { product: "the jacket", when: "from Friday" });
    expect(out).toContain("Meet the jacket.");
    expect(out).toContain("{benefit}");
    expect(out).toContain("from Friday");
  });
  it("every placeholder has a matching field", () => {
    for (const s of CAPTION_STARTERS) {
      const keys = [...s.body.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      for (const k of keys) expect(s.fields.some((f) => f.key === k)).toBe(true);
    }
  });
});
