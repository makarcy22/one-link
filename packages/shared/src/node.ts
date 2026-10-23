// Node-only helpers. Import from "@one-link/shared/node". Never import this in browser code.
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// AES-256-GCM token vault. SOCIAL_TOKEN_KEY must be 32 random bytes, base64.
function key(): Buffer {
  const buf = Buffer.from(process.env.SOCIAL_TOKEN_KEY ?? "", "base64");
  if (buf.length !== 32) {
    throw new Error("SOCIAL_TOKEN_KEY must be 32 bytes, base64-encoded. See docs/social-connectors.md.");
  }
  return buf;
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
}

export function decryptToken(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}

/** Constant-time comparison of two strings. */
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function hmacHex(algorithm: "sha256" | "sha512", secret: string, payload: string): string {
  return createHmac(algorithm, secret).update(payload).digest("hex");
}

/** Anything with a pg-style query method (a Pool, a Client or a test double). */
export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
}

export interface NotificationInput {
  userId: string;
  kind: string;
  title: string;
  body?: string;
  /** In-app section to open, for example "Planner". */
  link?: string;
  /** When set, the same notification is only created once for this user. */
  dedupeKey?: string;
}

/** Creates an in-app notification. Never throws: a failed notification must not break the work that caused it. */
export async function createNotification(db: Queryable, n: NotificationInput): Promise<boolean> {
  try {
    const res = await db.query(
      `INSERT INTO notifications (user_id, kind, title, body, link, dedupe_key)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (user_id, dedupe_key) DO NOTHING`,
      [n.userId, n.kind, n.title.slice(0, 200), (n.body ?? "").slice(0, 1000), n.link ?? "", n.dedupeKey ?? null]
    );
    return (res.rowCount ?? 0) > 0;
  } catch (e) {
    console.error("[notify]", e instanceof Error ? e.message : e);
    return false;
  }
}

/**
 * A URL a platform can fetch an uploaded file from, or null when the file is not publicly reachable.
 * Local disk storage is private to your computer, so only Cloudflare R2 with R2_PUBLIC_URL qualifies.
 */
export function publicMediaUrl(storageKey: string): string | null {
  if ((process.env.STORAGE_DRIVER ?? "local") !== "r2") return null;
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  if (!base) return null;
  return `${base}/${storageKey.split("/").map(encodeURIComponent).join("/")}`;
}
