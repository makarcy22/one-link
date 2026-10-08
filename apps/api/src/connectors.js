// Platform connector abstraction. Each connector implements only what its
// platform supports. The mock connector below stands in until real OAuth
// platform adapters are added in the review pass.
const MODES = {
    tiktok: "direct",
    instagram: "direct",
    facebook: "direct",
    linkedin: "direct",
    whatsapp: "manual",
};
export function platformMode(platform) {
    return MODES[platform.toLowerCase()] ?? "manual";
}
export async function mockPublish(platform, title) {
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
//# sourceMappingURL=connectors.js.map