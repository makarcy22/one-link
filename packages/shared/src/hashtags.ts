import { normalizeHashtag } from "./adapt.js";
import { platformInfo } from "./platforms.js";
import { CATEGORY_TAGS, type Momentum } from "./trends-data.js";

/** A trending tag with the context it was seen in. */
export interface TrendRef {
  tag: string;
  topic: string;
  momentum: Momentum;
  platforms: string[];
  regions: string[];
}

export interface HashtagContext {
  /** The post text the tags should fit. */
  text: string;
  platform: string;
  niche?: string;
  categories?: string[];
  region?: string;
  /** Tags the user has saved before. */
  saved?: string[];
  trending?: TrendRef[];
}

export type Tier = "strong" | "ok" | "weak";

export interface ScoredTag {
  tag: string;
  /** 0 to 100. How well this tag fits THIS post, not how popular it is. */
  score: number;
  tier: Tier;
  /** Why it was suggested, in plain language. */
  reasons: string[];
  /** Things to be careful about. */
  cautions: string[];
}

const STOP = new Set(
  ("the and for with this that from your you our are was were have has had will can not but all any one out new now get got " +
    "its into about more most than then them they their there what when where which who why how just very also been being " +
    "over only some such make made like want need let says said here come coming " +
    "something anything everything nothing thing things first look looks really great good best lands land very").split(" ")
);

/** Tags so broad that they attract views but rarely the right people. */
const GENERIC = new Set([
  "fyp", "foryou", "foryoupage", "viral", "trending", "love", "instagood", "like4like", "follow",
  "followme", "explore", "explorepage", "reels", "photooftheday", "instalike", "tiktok", "fy",
]);

export function tokenize(text: string): string[] {
  const words = (text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []).map((w) => w.replace(/'/g, ""));
  return words.filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w));
}

/** "#JubaFashion" -> ["juba", "fashion"] */
export function tagWords(tag: string): string[] {
  return tag
    .replace(/^#/, "")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .map((w) => w.toLowerCase())
    .filter(Boolean);
}

function matches(tagLower: string, words: string[], token: string): boolean {
  if (words.includes(token)) return true;
  return token.length >= 4 && tagLower.includes(token);
}

interface Candidate {
  tag: string;
  fromText: boolean;
  fromNiche: boolean;
  fromCategory: boolean;
  saved: boolean;
  trend?: TrendRef;
}

function toCamel(words: string[]): string {
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

function collect(ctx: HashtagContext): Candidate[] {
  const map = new Map<string, Candidate>();
  const add = (raw: string, patch: Partial<Candidate>) => {
    const tag = normalizeHashtag(raw);
    if (!tag || tag.length < 3) return;
    const key = tag.toLowerCase();
    const cur = map.get(key) ?? { tag, fromText: false, fromNiche: false, fromCategory: false, saved: false };
    map.set(key, { ...cur, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined && v !== false)) });
  };

  const tokens = tokenize(ctx.text);
  const seen = new Set<string>();
  const uniq = tokens.filter((t) => (seen.has(t) ? false : (seen.add(t), true)));
  for (const t of uniq.filter((w) => w.length >= 5).slice(0, 6)) add(t, { fromText: true });
  // Adjacent word pairs make arbitrary tags that nobody searches, so only single words are offered from the text.

  const niche = (ctx.niche ?? "").trim();
  if (niche) {
    const words = tokenize(niche);
    if (words.length) add(toCamel(words), { fromNiche: true });
    for (const w of words.filter((x) => x.length >= 4)) add(w, { fromNiche: true });
  }
  for (const c of ctx.categories ?? []) {
    for (const t of CATEGORY_TAGS[c] ?? []) add(t, { fromCategory: true });
  }
  if (niche) {
    for (const [cat, tags] of Object.entries(CATEGORY_TAGS)) {
      if (cat.toLowerCase().includes(niche.toLowerCase()) || niche.toLowerCase().includes(cat.toLowerCase())) {
        for (const t of tags) add(t, { fromCategory: true });
      }
    }
  }
  for (const s of ctx.saved ?? []) add(s, { saved: true });
  for (const tr of ctx.trending ?? []) add(tr.tag, { trend: tr });
  return [...map.values()];
}

export function scoreCandidate(c: Candidate, ctx: HashtagContext): ScoredTag {
  const reasons: string[] = [];
  const cautions: string[] = [];
  const tagLower = c.tag.slice(1).toLowerCase();
  const words = tagWords(c.tag);
  const tokens = new Set(tokenize(ctx.text));
  const platform = platformInfo(ctx.platform);
  const region = (ctx.region ?? "").toLowerCase();

  let score = 20;

  const hit = [...tokens].filter((t) => matches(tagLower, words, t));
  if (hit.length) {
    score += Math.min(35, 22 + hit.length * 8);
    reasons.push(`Matches ${hit.slice(0, 2).map((h) => `"${h}"`).join(" and ")} in your post`);
  }

  const nicheWords = tokenize(ctx.niche ?? "");
  if (nicheWords.some((w) => matches(tagLower, words, w))) {
    score += 18;
    reasons.push(`Fits your niche: ${ctx.niche}`);
  } else if (c.fromCategory) {
    score += 12;
    reasons.push("Common in your content categories");
  }

  if (c.saved) {
    score += 8;
    reasons.push("You saved this tag before");
  }

  if (c.trend) {
    const onPlatform = c.trend.platforms.includes(ctx.platform.toLowerCase());
    const inRegion = region && region !== "global" && c.trend.regions.includes(region);
    const base = c.trend.momentum === "rising" ? 14 : c.trend.momentum === "seasonal" ? 10 : 6;
    score += onPlatform ? base : Math.round(base / 2);
    const when = c.trend.momentum === "rising" ? "Rising idea" : c.trend.momentum === "seasonal" ? "Seasonal idea" : "Steady idea";
    reasons.push(`${when}: ${c.trend.topic}${onPlatform ? ` (works on ${platform?.label ?? ctx.platform})` : ""}`);
    if (inRegion) {
      score += 8;
      reasons.push("Relevant in your region");
    }
  }

  if (GENERIC.has(tagLower)) {
    score -= 25;
    cautions.push("Very broad. Many people use it, but few of them are your audience. Popularity is not the same as fit.");
  }
  if (tagLower.length > 24) {
    score -= 10;
    cautions.push("Long tags are hard to read and rarely searched.");
  } else if (tagLower.length < 4) {
    score -= 8;
    cautions.push("Very short tags are usually too generic.");
  }
  if (!hit.length && !c.fromNiche && !c.fromCategory && !c.saved && !c.trend) {
    cautions.push("Does not clearly match your post.");
    score -= 10;
  }
  if (reasons.length === 0) reasons.push("A general tag for this kind of content");

  score = Math.max(0, Math.min(100, Math.round(score)));
  const tier: Tier = score >= 65 ? "strong" : score >= 40 ? "ok" : "weak";
  return { tag: c.tag, score, tier, reasons, cautions };
}

export function scoreHashtag(tag: string, ctx: HashtagContext): ScoredTag {
  const norm = normalizeHashtag(tag) || tag;
  const found = collect(ctx).find((c) => c.tag.toLowerCase() === norm.toLowerCase());
  return scoreCandidate(found ?? { tag: norm, fromText: false, fromNiche: false, fromCategory: false, saved: false }, ctx);
}

export interface Suggestions {
  suggestions: ScoredTag[];
  /** Advice about the whole set. */
  notes: string[];
}

export function suggestHashtags(ctx: HashtagContext, count = 10): Suggestions {
  const notes: string[] = [];
  const text = (ctx.text ?? "").trim();
  if (!text && !(ctx.niche ?? "").trim() && !(ctx.categories ?? []).length) {
    notes.push("Write your post or set a niche first, so suggestions can match what you are posting.");
  }
  const scored = collect(ctx)
    .map((c) => scoreCandidate(c, ctx))
    .sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag));

  // Do not fill the list with broad tags.
  const out: ScoredTag[] = [];
  let broad = 0;
  for (const s of scored) {
    const isBroad = s.cautions.some((c) => c.startsWith("Very broad"));
    if (isBroad && broad >= 1) continue;
    if (isBroad) broad += 1;
    out.push(s);
    if (out.length >= count) break;
  }

  const info = platformInfo(ctx.platform);
  if (info && info.maxHashtags > 0) {
    notes.push(`On ${info.label}, ${info.idealHashtags[0]}–${info.idealHashtags[1]} relevant hashtags usually work better than many.`);
  }
  if (out.length && out.every((s) => s.tier !== "strong")) {
    notes.push("None of these are a strong match yet. Add more detail to your post or set your niche in Profile.");
  }
  return { suggestions: out, notes };
}

/** Best tags for a platform, ready to attach to a post. */
export function pickTags(s: Suggestions, platform: string): string[] {
  const info = platformInfo(platform);
  const max = info ? info.idealHashtags[1] : 5;
  return s.suggestions.filter((x) => x.tier !== "weak").slice(0, max).map((x) => x.tag);
}
