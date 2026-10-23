// Pure scheduling helpers (no database or Redis), so they are easy to test.
import { PLATFORM_KEYS } from "@one-link/shared";

export const KNOWN_PLATFORMS: string[] = [...PLATFORM_KEYS];

/** A schedule may be created at most this far ahead. */
export const MAX_HORIZON_MS = 365 * 24 * 60 * 60 * 1000;

/** Accepts an array or a JSON string; returns unique, known, lowercase platform keys. */
export function parsePlatforms(input: unknown): string[] {
  let list: unknown = input;
  if (typeof input === "string") {
    try {
      list = JSON.parse(input);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  for (const item of list) {
    if (typeof item !== "string") continue;
    const key = item.trim().toLowerCase();
    if (KNOWN_PLATFORMS.includes(key)) seen.add(key);
  }
  return [...seen];
}

/** Parses an ISO date string or timestamp; null when invalid. */
export function parseWhen(input: unknown): Date | null {
  if (typeof input !== "string" && typeof input !== "number") return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Milliseconds to wait before a job should run. A time in the past runs immediately. */
export function delayUntil(when: Date, now: number = Date.now()): number {
  return Math.max(0, when.getTime() - now);
}

/** Queue job id for a publishing_jobs row. BullMQ ids must not contain ":". */
export function jobKey(publishingJobId: string): string {
  return `publish-${publishingJobId}`;
}

/** Queue job id for the "time to post this yourself" reminder of a manual job. */
export function reminderKey(publishingJobId: string): string {
  return `remind-${publishingJobId}`;
}

/** Retry policy: three attempts with exponential backoff starting at 30 seconds. */
export const JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 30_000 },
  removeOnComplete: true,
  removeOnFail: 1000,
};
