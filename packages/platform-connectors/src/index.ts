import { isDirect, type PlatformKey } from "@one-link/shared";
import { createFacebookAdapter } from "./facebook.js";
import type { Adapter, AdapterOptions, PublishRequest, PublishResult } from "./types.js";

export * from "./types.js";
export { createFacebookAdapter, listPages, mapGraphError, graphVersion, DEFAULT_GRAPH_VERSION, type FacebookPage } from "./facebook.js";

/** Returns the real adapter for a platform, or null when One Link cannot post there yet. */
export function getAdapter(platform: string, opts: AdapterOptions = {}): Adapter | null {
  if (!isDirect(platform)) return null;
  if (platform === "facebook") return createFacebookAdapter(opts);
  return null;
}

/**
 * Test mode: pretends to publish without calling the platform. Turn it on with PUBLISH_DRY_RUN=true
 * to try the whole flow before a platform app is approved. Results are clearly marked as dry runs.
 */
export function createDryRunAdapter(platform: PlatformKey): Adapter {
  return {
    platform,
    async publish(_req: PublishRequest): Promise<PublishResult> {
      return { externalId: `dryrun_${platform}_${Date.now()}`, dryRun: true };
    },
  };
}
