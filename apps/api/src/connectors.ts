// Platform connector abstraction. Each connector implements only what its
// platform supports. The mock connector below stands in until real OAuth
// platform adapters are added in the review pass.

export type PlatformMode = "direct" | "manual";

export interface PublishResult {
  ok: boolean;
  externalId: string;
  message: string;
}

const MODES: Record<string, PlatformMode> = {
  tiktok: "direct",
  instagram: "direct",
  facebook: "direct",
  linkedin: "direct",
  x: "direct",
  whatsapp: "manual",
};

export function platformMode(platform: string): PlatformMode {
  return MODES[platform.toLowerCase()] ?? "manual";
}

export async function mockPublish(platform: string, title: string): Promise<PublishResult> {
  const mode = platformMode(platform);
  if (mode === "manual") {
    return {
      ok: false,
      externalId: "",
      message: `${platform} requires manual posting; export prepared for "${title}".`,
    };
  }
  return {
    ok: true,
    externalId: `mock_${Date.now()}`,
    message: `Published to ${platform} (mock connector): "${title}".`,
  };
}
