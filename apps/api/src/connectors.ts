// Which platforms One Link can post to by itself, and which need a person's hands.
// The real logic lives in @one-link/shared; this file keeps the old import path working.
import { isPlatformKey, publishMode, type PublishMode } from "@one-link/shared";

export type PlatformMode = PublishMode;

/** "direct" = One Link posts for you. "soon" = connect now, posting comes next. "manual" = you post it. */
export function platformMode(platform: string): PlatformMode {
  const key = platform.toLowerCase();
  return isPlatformKey(key) ? publishMode(key) : "manual";
}

/** True only when a real publisher exists. Everything else is prepared for the person to post. */
export function canAutoPublish(platform: string): boolean {
  return platformMode(platform) === "direct";
}
