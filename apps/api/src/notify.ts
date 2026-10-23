import { createNotification } from "@one-link/shared/node";
import { pool } from "./db.js";

/** Create an in-app notification. Never throws. `dedupeKey` makes it happen once per user. */
export function notify(userId: string, kind: string, title: string, body = "", link = "", dedupeKey?: string) {
  return createNotification(pool, { userId, kind, title, body, link, dedupeKey });
}
