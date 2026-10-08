export type PlatformMode = "direct" | "manual";
export interface PublishResult {
    ok: boolean;
    externalId: string;
    message: string;
}
export declare function platformMode(platform: string): PlatformMode;
export declare function mockPublish(platform: string, title: string): Promise<PublishResult>;
