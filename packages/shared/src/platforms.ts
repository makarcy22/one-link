// Platform rules used by the API, the worker and the web app.
// Limits change over time; they are conservative defaults, kept in one place so
// they are easy to update. Verify against each platform's current documentation.

export const PLATFORM_KEYS = ["facebook", "instagram", "tiktok", "linkedin", "x", "whatsapp"] as const;
export type PlatformKey = (typeof PLATFORM_KEYS)[number];

/**
 * direct  - a real publishing adapter exists; One Link posts for the user.
 * soon    - the account can be connected, but posting is not built yet; treated as manual for now.
 * manual  - the platform has no public posting API; One Link prepares the post and the user finishes it.
 */
export type PublishMode = "direct" | "soon" | "manual";

export interface PlatformInfo {
  key: PlatformKey;
  label: string;
  mode: PublishMode;
  /** Hard limit on caption length in characters. */
  maxChars: number;
  /** Length after which the post is likely to be folded behind "See more" (soft warning). */
  softChars?: number;
  maxHashtags: number;
  /** Recommended hashtag range [min, max]. */
  idealHashtags: [number, number];
  /** What a post needs. */
  needs: "text" | "image" | "video" | "image-or-video";
  supports: { text: boolean; image: boolean; video: boolean; link: boolean };
  note: string;
}

export const PLATFORMS: Record<PlatformKey, PlatformInfo> = {
  facebook: {
    key: "facebook",
    label: "Facebook Page",
    mode: "direct",
    maxChars: 63206,
    softChars: 480,
    maxHashtags: 30,
    idealHashtags: [1, 3],
    needs: "text",
    supports: { text: true, image: true, video: false, link: true },
    note: "Posts to a Facebook Page you manage. Image posts need a publicly reachable image URL.",
  },
  instagram: {
    key: "instagram",
    label: "Instagram",
    mode: "soon",
    maxChars: 2200,
    maxHashtags: 30,
    idealHashtags: [3, 5],
    needs: "image-or-video",
    supports: { text: false, image: true, video: true, link: false },
    note: "Needs an image or video. Links in captions are not clickable.",
  },
  tiktok: {
    key: "tiktok",
    label: "TikTok",
    mode: "soon",
    maxChars: 2200,
    maxHashtags: 30,
    idealHashtags: [3, 5],
    needs: "video",
    supports: { text: false, image: false, video: true, link: false },
    note: "Needs a vertical video.",
  },
  linkedin: {
    key: "linkedin",
    label: "LinkedIn",
    mode: "soon",
    maxChars: 3000,
    softChars: 210,
    maxHashtags: 10,
    idealHashtags: [3, 5],
    needs: "text",
    supports: { text: true, image: true, video: true, link: true },
    note: "Professional tone works best. Only the first lines show before 'see more'.",
  },
  x: {
    key: "x",
    label: "X",
    mode: "soon",
    maxChars: 280,
    maxHashtags: 5,
    idealHashtags: [1, 2],
    needs: "text",
    supports: { text: true, image: true, video: true, link: true },
    note: "280 characters on a standard account. Links count as 23 characters.",
  },
  whatsapp: {
    key: "whatsapp",
    label: "WhatsApp Status",
    mode: "manual",
    maxChars: 700,
    maxHashtags: 0,
    idealHashtags: [0, 0],
    needs: "text",
    supports: { text: true, image: true, video: true, link: true },
    note: "WhatsApp has no posting API. One Link prepares the post and you finish it in WhatsApp.",
  },
};

export function isPlatformKey(value: unknown): value is PlatformKey {
  return typeof value === "string" && (PLATFORM_KEYS as readonly string[]).includes(value);
}

export function platformInfo(key: string): PlatformInfo | null {
  const k = key.trim().toLowerCase();
  return isPlatformKey(k) ? PLATFORMS[k] : null;
}

/** How a platform is published right now. Unknown platforms are manual. */
export function publishMode(key: string): PublishMode {
  return platformInfo(key)?.mode ?? "manual";
}

/** True when One Link will post automatically for this platform. */
export function isDirect(key: string): boolean {
  return publishMode(key) === "direct";
}

export function platformLabel(key: string): string {
  return platformInfo(key)?.label ?? key;
}
