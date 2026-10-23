// Built-in graphic templates (rendered as SVG) and caption starters.
// Everything here is pure: the same input always gives the same output.

export interface Theme {
  id: string;
  name: string;
  bg: string;
  fg: string;
  accent: string;
  /** Text that sits ON the accent colour. Chosen for readable contrast. */
  onAccent: string;
  muted: string;
}

export const THEMES: Theme[] = [
  { id: "bold", name: "Bold", bg: "#111111", fg: "#ffffff", accent: "#ff5a1f", onAccent: "#111111", muted: "#c9c9c4" },
  { id: "paper", name: "Paper", bg: "#f4f4f2", fg: "#111111", accent: "#ff5a1f", onAccent: "#111111", muted: "#55554f" },
  { id: "sunrise", name: "Sunrise", bg: "#ff5a1f", fg: "#111111", accent: "#ffffff", onAccent: "#111111", muted: "#3a1a0c" },
  { id: "gold", name: "Gold", bg: "#1a1710", fg: "#fff7e0", accent: "#e0b43a", onAccent: "#111111", muted: "#cbbf95" },
  { id: "fresh", name: "Fresh", bg: "#ecfdf5", fg: "#0f2e1c", accent: "#16a34a", onAccent: "#ffffff", muted: "#3f5f4d" },
];

export interface TemplateField {
  key: string;
  label: string;
  placeholder: string;
  max: number;
  multiline?: boolean;
}

export interface GraphicTemplate {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  fields: TemplateField[];
}

export const GRAPHIC_TEMPLATES: GraphicTemplate[] = [
  { id: "announcement", name: "Announcement", description: "News, a launch or a new arrival.", width: 1080, height: 1080,
    fields: [
      { key: "label", label: "Label", placeholder: "NEW", max: 14 },
      { key: "headline", label: "Headline", placeholder: "The autumn collection is here", max: 70 },
      { key: "sub", label: "Details", placeholder: "Available this Friday in store and online", max: 100 },
      { key: "cta", label: "Button text", placeholder: "Shop now", max: 24 },
    ] },
  { id: "quote", name: "Quote", description: "A line from a customer, a lesson or a saying.", width: 1080, height: 1080,
    fields: [
      { key: "quote", label: "Quote", placeholder: "The best time to start was yesterday. The next best is today.", max: 150, multiline: true },
      { key: "author", label: "Who said it", placeholder: "Amira, customer", max: 40 },
    ] },
  { id: "sale", name: "Sale or offer", description: "A discount, a bundle or a limited offer.", width: 1080, height: 1080,
    fields: [
      { key: "offer", label: "Big text", placeholder: "30% OFF", max: 14 },
      { key: "headline", label: "What is it for", placeholder: "Everything in the shop", max: 60 },
      { key: "when", label: "When", placeholder: "This weekend only", max: 50 },
    ] },
  { id: "event", name: "Event (story size)", description: "A date, a place and a time. Fits Stories and Status.", width: 1080, height: 1920,
    fields: [
      { key: "date", label: "Date", placeholder: "Sat 14 Nov", max: 20 },
      { key: "title", label: "Event name", placeholder: "Open day", max: 50 },
      { key: "place", label: "Place", placeholder: "Juba, Hai Jalaba", max: 50 },
      { key: "time", label: "Time", placeholder: "10:00 to 16:00", max: 30 },
    ] },
  { id: "tip", name: "Tip", description: "One helpful idea with up to three points.", width: 1080, height: 1080,
    fields: [
      { key: "title", label: "Title", placeholder: "3 ways to photograph your products", max: 70 },
      { key: "points", label: "Points (one per line)", placeholder: "Use window light\nKeep the background plain\nShoot from three angles", max: 220, multiline: true },
    ] },
  { id: "testimonial", name: "Testimonial (wide)", description: "A customer review. Fits Facebook link posts.", width: 1200, height: 630,
    fields: [
      { key: "quote", label: "Review", placeholder: "Fast delivery and exactly what I ordered.", max: 120, multiline: true },
      { key: "author", label: "Name", placeholder: "Joseph, Juba", max: 40 },
    ] },
];

export function themeById(id: string | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function templateById(id: string): GraphicTemplate | undefined {
  return GRAPHIC_TEMPLATES.find((t) => t.id === id);
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Breaks text into lines of about `maxChars` characters, at word boundaries. */
export function wrapLines(text: string, maxChars: number, maxLines = 6): string[] {
  const out: string[] = [];
  for (const para of text.replace(/\r/g, "").split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      if (!line) line = word;
      else if (Array.from(`${line} ${word}`).length <= maxChars) line += ` ${word}`;
      else {
        out.push(line);
        line = word;
      }
    }
    if (line) out.push(line);
  }
  if (out.length > maxLines) {
    const cut = out.slice(0, maxLines);
    cut[maxLines - 1] = `${cut[maxLines - 1].replace(/[.,;:!?-]+$/u, "")}…`;
    return cut;
  }
  return out;
}

const FONT = "Inter, Arial, Helvetica, sans-serif";

function text(x: number, y: number, size: number, fill: string, content: string, opts: { weight?: number; anchor?: string; opacity?: number; spacing?: number } = {}): string {
  const { weight = 700, anchor = "start", opacity = 1, spacing = 0 } = opts;
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}" letter-spacing="${spacing}">${escapeXml(content)}</text>`;
}

function lines(x: number, y: number, size: number, lh: number, fill: string, rows: string[], opts: { weight?: number; anchor?: string } = {}): string {
  return rows.map((r, i) => text(x, y + i * lh, size, fill, r, opts)).join("");
}

function brandMark(t: Theme, w: number, h: number): string {
  const y = h - 70;
  return `<g><circle cx="90" cy="${y - 12}" r="14" fill="none" stroke="${t.accent}" stroke-width="6"/><circle cx="112" cy="${y - 12}" r="14" fill="none" stroke="${t.accent}" stroke-width="6"/>${text(140, y - 2, 30, t.muted, "made with One Link", { weight: 600 })}</g>`;
}

/** Renders a template to an SVG string. Missing fields fall back to the template's example text. */
export function renderTemplate(templateId: string, values: Record<string, string>, themeId?: string): string {
  const tpl = templateById(templateId) ?? GRAPHIC_TEMPLATES[0];
  const t = themeById(themeId);
  const { width: w, height: h } = tpl;
  const v = (key: string) => {
    const f = tpl.fields.find((x) => x.key === key);
    const raw = (values[key] ?? "").trim();
    return (raw || f?.placeholder || "").slice(0, f?.max ?? 200);
  };
  let body = "";

  if (tpl.id === "announcement") {
    const label = v("label");
    const pillW = Math.max(160, Array.from(label).length * 26 + 70);
    body += `<rect x="90" y="110" width="${pillW}" height="62" rx="31" fill="${t.accent}"/>`;
    body += text(90 + pillW / 2, 154, 32, t.onAccent, label.toUpperCase(), { anchor: "middle", weight: 800, spacing: 2 });
    body += lines(90, 400, 100, 116, t.fg, wrapLines(v("headline"), 15, 4), { weight: 800 });
    body += lines(90, 400 + 116 * Math.min(4, wrapLines(v("headline"), 15, 4).length) + 30, 44, 60, t.muted, wrapLines(v("sub"), 34, 3), { weight: 500 });
    const cta = v("cta");
    const ctaW = Math.max(240, Array.from(cta).length * 24 + 100);
    body += `<rect x="90" y="${h - 250}" width="${ctaW}" height="96" rx="48" fill="${t.accent}"/>`;
    body += text(90 + ctaW / 2, h - 188, 40, t.onAccent, cta, { anchor: "middle", weight: 800 });
  } else if (tpl.id === "quote") {
    body += text(80, 270, 300, t.accent, "“", { weight: 800 });
    const rows = wrapLines(v("quote"), 22, 6);
    body += lines(90, 400, 70, 92, t.fg, rows, { weight: 700 });
    body += `<rect x="90" y="${400 + rows.length * 92 + 10}" width="90" height="8" rx="4" fill="${t.accent}"/>`;
    body += text(90, 400 + rows.length * 92 + 80, 40, t.muted, v("author"), { weight: 600 });
  } else if (tpl.id === "sale") {
    body += `<rect x="90" y="110" width="200" height="62" rx="31" fill="${t.accent}"/>`;
    body += text(190, 154, 30, t.onAccent, "OFFER", { anchor: "middle", weight: 800, spacing: 3 });
    const big = v("offer").toUpperCase();
    const size = Array.from(big).length > 8 ? 180 : 260;
    body += text(90, 520, size, t.accent, big, { weight: 800 });
    body += lines(90, 650, 64, 78, t.fg, wrapLines(v("headline"), 22, 3), { weight: 800 });
    body += text(90, h - 190, 44, t.muted, v("when"), { weight: 600 });
  } else if (tpl.id === "event") {
    body += `<rect x="90" y="150" width="${Math.max(260, Array.from(v("date")).length * 40 + 80)}" height="100" rx="50" fill="${t.accent}"/>`;
    body += text(90 + Math.max(260, Array.from(v("date")).length * 40 + 80) / 2, 218, 54, t.onAccent, v("date"), { anchor: "middle", weight: 800 });
    const rows = wrapLines(v("title"), 12, 4);
    body += lines(90, 700, 120, 136, t.fg, rows, { weight: 800 });
    body += text(90, 700 + rows.length * 136 + 60, 54, t.fg, v("place"), { weight: 600 });
    body += text(90, 700 + rows.length * 136 + 130, 54, t.muted, v("time"), { weight: 500 });
  } else if (tpl.id === "tip") {
    body += `<rect x="90" y="110" width="150" height="62" rx="31" fill="${t.accent}"/>`;
    body += text(165, 154, 30, t.onAccent, "TIP", { anchor: "middle", weight: 800, spacing: 3 });
    const titleRows = wrapLines(v("title"), 20, 3);
    body += lines(90, 330, 78, 94, t.fg, titleRows, { weight: 800 });
    const points = v("points").split("\n").map((p) => p.trim()).filter(Boolean).slice(0, 3);
    let y = 330 + titleRows.length * 94 + 70;
    points.forEach((p, i) => {
      body += `<circle cx="120" cy="${y - 14}" r="28" fill="${t.accent}"/>`;
      body += text(120, y - 2, 34, t.onAccent, String(i + 1), { anchor: "middle", weight: 800 });
      const rows = wrapLines(p, 30, 2);
      body += lines(180, y, 44, 54, t.fg, rows, { weight: 600 });
      y += Math.max(1, rows.length) * 54 + 52;
    });
  } else {
    // testimonial
    body += text(60, 190, 200, t.accent, "“", { weight: 800 });
    const rows = wrapLines(v("quote"), 34, 4);
    body += lines(100, 250, 52, 70, t.fg, rows, { weight: 700 });
    body += text(100, 250 + rows.length * 70 + 40, 34, t.muted, v("author"), { weight: 600 });
  }

  const mark = tpl.id === "testimonial" ? "" : brandMark(t, w, h);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(tpl.name)}"><rect width="${w}" height="${h}" fill="${t.bg}"/>${body}${mark}</svg>`;
}

export interface CaptionStarter {
  id: string;
  name: string;
  /** Use {braces} for the parts the user fills in. */
  body: string;
  fields: { key: string; label: string; placeholder: string }[];
}

export const CAPTION_STARTERS: CaptionStarter[] = [
  { id: "launch", name: "Product launch", body: "Meet {product}. {benefit}\n\nAvailable {when}. {cta}",
    fields: [{ key: "product", label: "Product", placeholder: "the Kitenge jacket" }, { key: "benefit", label: "Why people will love it", placeholder: "Made in Juba, made to last." }, { key: "when", label: "When", placeholder: "from Friday" }, { key: "cta", label: "Call to action", placeholder: "Message us to order." }] },
  { id: "bts", name: "Behind the scenes", body: "Ever wondered how {thing} is made? Here is a look.\n\n{detail}\n\nWhat should we show next?",
    fields: [{ key: "thing", label: "What you make", placeholder: "our bags" }, { key: "detail", label: "One detail", placeholder: "Every stitch is done by hand." }] },
  { id: "story", name: "Customer story", body: "\"{quote}\"\n\nThank you, {name}. Stories like this are why we do this.",
    fields: [{ key: "quote", label: "What they said", placeholder: "It arrived the next day and fits perfectly." }, { key: "name", label: "Their name", placeholder: "Amira" }] },
  { id: "event", name: "Event reminder", body: "{event} is {when}.\n\n{place}. {time}.\n\nBring a friend. {cta}",
    fields: [{ key: "event", label: "Event", placeholder: "Our open day" }, { key: "when", label: "When", placeholder: "this Saturday" }, { key: "place", label: "Place", placeholder: "Hai Jalaba, Juba" }, { key: "time", label: "Time", placeholder: "10:00 to 16:00" }, { key: "cta", label: "Call to action", placeholder: "See you there." }] },
  { id: "offer", name: "Offer", body: "{offer} on {what}, {when}.\n\n{detail}\n\n{cta}",
    fields: [{ key: "offer", label: "Offer", placeholder: "30% off" }, { key: "what", label: "On what", placeholder: "everything in store" }, { key: "when", label: "Until", placeholder: "until Sunday" }, { key: "detail", label: "Detail", placeholder: "No code needed." }, { key: "cta", label: "Call to action", placeholder: "Order today." }] },
  { id: "tip", name: "Helpful tip", body: "Quick tip: {tip}\n\n{why}\n\nSave this for later.",
    fields: [{ key: "tip", label: "The tip", placeholder: "shoot your products next to a window" }, { key: "why", label: "Why it works", placeholder: "Natural light shows true colours." }] },
];

/** Fills {placeholders}. Anything left empty keeps its placeholder so the user can see what is missing. */
export function fillCaption(starter: CaptionStarter, values: Record<string, string>): string {
  return starter.body.replace(/\{(\w+)\}/g, (_m, key: string) => (values[key] ?? "").trim() || `{${key}}`);
}
