import { PLATFORMS, platformInfo, type PlatformInfo, type PlatformKey } from "./platforms.js";

export interface AdaptInput {
  text: string;
  platform: string;
  hashtags?: string[];
  link?: string;
  /** Kind of media attached to the post, if any. */
  media?: "image" | "video" | "audio" | null;
}

export interface Variant {
  platform: PlatformKey;
  caption: string;
  hashtags: string[];
  link: string;
  /** The exact text that will be posted: caption, then link, then hashtags. */
  final: string;
  chars: number;
  limit: number;
  fits: boolean;
  /** Plain-language notes about what was changed or what to check. */
  warnings: string[];
  /** Problems that stop the post from being published as-is. */
  blockers: string[];
}

const URL_WEIGHT_X = 23;

export function normalizeHashtag(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^#+/, "")
    .replace(/[^\p{L}\p{N}_]/gu, "");
  return cleaned ? `#${cleaned}` : "";
}

export function normalizeHashtags(list: readonly string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list ?? []) {
    const tag = normalizeHashtag(raw);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

/** Counts characters the way people see them (code points, not UTF-16 units). */
export function countChars(text: string): number {
  return Array.from(text).length;
}

function tidy(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function assemble(caption: string, link: string, tags: string[]): string {
  const parts = [caption];
  if (link) parts.push(link);
  if (tags.length) parts.push(tags.join(" "));
  return parts.filter(Boolean).join("\n\n");
}

function lengthOf(platform: PlatformInfo, caption: string, link: string, tags: string[]): number {
  if (platform.key === "x" && link) {
    // X counts every URL as a fixed length, whatever its real length.
    return countChars(assemble(caption, "", tags)) + (caption || tags.length ? 2 : 0) + URL_WEIGHT_X;
  }
  return countChars(assemble(caption, link, tags));
}

/** Shortens text at a word boundary and adds an ellipsis. */
export function shorten(text: string, max: number): string {
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  if (max <= 1) return "…".slice(0, max);
  const cut = chars.slice(0, max - 1).join("");
  const lastSpace = cut.search(/\s\S*$/);
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s.,;:!?-]+$/u, "")}…`;
}

/** Prepares one post for one platform. Pure and deterministic. */
export function adaptForPlatform(input: AdaptInput): Variant | null {
  const info = platformInfo(input.platform);
  if (!info) return null;

  const warnings: string[] = [];
  const blockers: string[] = [];
  let caption = tidy(input.text ?? "");
  const link = (input.link ?? "").trim();
  let tags = normalizeHashtags(input.hashtags);

  if (!caption) blockers.push("Write something first. The post is empty.");

  // Hashtags: keep only what the platform handles well.
  if (info.maxHashtags === 0) {
    if (tags.length) warnings.push(`${info.label} does not use hashtags, so they were left out.`);
    tags = [];
  } else {
    if (tags.length > info.maxHashtags) {
      warnings.push(`${info.label} allows at most ${info.maxHashtags} hashtags, so the extra ${tags.length - info.maxHashtags} were left out.`);
      tags = tags.slice(0, info.maxHashtags);
    } else if (tags.length > info.idealHashtags[1]) {
      warnings.push(`${tags.length} hashtags is more than the ${info.idealHashtags[0]}–${info.idealHashtags[1]} that work best on ${info.label}. Fewer, more relevant tags look less spammy.`);
    }
    if (tags.length === 0 && info.idealHashtags[0] > 0) {
      warnings.push(`Add ${info.idealHashtags[0]}–${info.idealHashtags[1]} relevant hashtags to help people find this.`);
    }
  }

  // Length: shorten the caption, never the hashtags or the link.
  let length = lengthOf(info, caption, link, tags);
  if (length > info.maxChars) {
    const overhead = lengthOf(info, "", link, tags);
    const room = info.maxChars - overhead - 2;
    if (room < 20) {
      blockers.push(`Too long for ${info.label} even without the caption. Remove the link or some hashtags.`);
    } else {
      const before = countChars(caption);
      caption = shorten(caption, room);
      warnings.push(`Shortened from ${before} to ${countChars(caption)} characters to fit ${info.label}'s ${info.maxChars}-character limit. Review the ending.`);
    }
    length = lengthOf(info, caption, link, tags);
  } else if (info.softChars && countChars(caption) > info.softChars) {
    warnings.push(`Only the first ~${info.softChars} characters are likely to show before "See more" on ${info.label}. Put your hook first.`);
  }

  // Media requirements.
  const media = input.media ?? null;
  if (info.needs === "video" && media !== "video") blockers.push(`${info.label} needs a video. Upload one to publish here.`);
  if (info.needs === "image-or-video" && media !== "image" && media !== "video") {
    blockers.push(`${info.label} needs an image or a video. Upload one to publish here.`);
  }
  if (media === "image" && !info.supports.image) warnings.push(`${info.label} does not take images from One Link, so the image was left out.`);
  if (media === "video" && !info.supports.video && info.needs !== "video") warnings.push(`${info.label} does not take videos from One Link, so the video was left out.`);
  if (link && !info.supports.link) warnings.push(`Links are not clickable on ${info.label}.`);

  if (info.mode === "manual") warnings.push("One Link cannot post here for you. It will prepare the post so you can finish it yourself.");
  if (info.mode === "soon") warnings.push(`Automatic posting to ${info.label} is not available yet. One Link will prepare it for you to post.`);

  const final = assemble(caption, link, tags);
  return {
    platform: info.key,
    caption,
    hashtags: tags,
    link,
    final,
    chars: length,
    limit: info.maxChars,
    fits: length <= info.maxChars,
    warnings,
    blockers,
  };
}

export function adaptAll(
  text: string,
  platforms: readonly string[],
  opts: { hashtags?: string[]; link?: string; media?: "image" | "video" | "audio" | null } = {}
): Variant[] {
  const out: Variant[] = [];
  const seen = new Set<string>();
  for (const p of platforms) {
    const key = p.trim().toLowerCase();
    if (seen.has(key) || !(key in PLATFORMS)) continue;
    seen.add(key);
    const v = adaptForPlatform({ text, platform: key, hashtags: opts.hashtags, link: opts.link, media: opts.media });
    if (v) out.push(v);
  }
  return out;
}
