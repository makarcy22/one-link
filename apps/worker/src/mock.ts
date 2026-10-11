// Duplicated from apps/api/src/connectors.ts so the worker builds standalone.
// Extract both into @one-link/platform-connectors during the review pass.

export interface PublishResult {
  ok: boolean;
  externalId: string;
  message: string;
}

export function platformMode(platform: string): "direct" | "manual" {
  const direct = ["tiktok", "instagram", "facebook", "linkedin", "x"];
  return direct.includes(platform.toLowerCase()) ? "direct" : "manual";
}

export async function mockPublish(platform: string, title: string): Promise<PublishResult> {
  if (platformMode(platform) === "manual") {
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
