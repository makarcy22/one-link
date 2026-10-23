import type { PlatformKey } from "@one-link/shared";

export type PublishErrorKind = "auth" | "permission" | "rate_limit" | "invalid" | "network" | "server" | "unknown";

/**
 * A publishing failure, already classified.
 * `retryable` tells the worker whether trying again later can help.
 * `userMessage` is safe to show to the user; it never contains tokens.
 */
export class PublishError extends Error {
  readonly kind: PublishErrorKind;
  readonly retryable: boolean;
  readonly status?: number;
  readonly code?: number;

  constructor(userMessage: string, kind: PublishErrorKind, retryable: boolean, extra: { status?: number; code?: number } = {}) {
    super(userMessage);
    this.name = "PublishError";
    this.kind = kind;
    this.retryable = retryable;
    this.status = extra.status;
    this.code = extra.code;
  }
}

export interface PublishRequest {
  /** Page or account access token (already decrypted). Never log it. */
  accessToken: string;
  /** The page or account id on the platform. */
  accountId: string;
  text: string;
  link?: string;
  /** A publicly reachable image URL. */
  imageUrl?: string;
}

export interface PublishResult {
  /** The id of the post on the platform. */
  externalId: string;
  /** A link to the live post, when the platform gives enough to build one. */
  url?: string;
  dryRun?: boolean;
}

export interface Adapter {
  platform: PlatformKey;
  publish(req: PublishRequest): Promise<PublishResult>;
}

export interface AdapterOptions {
  fetch?: typeof fetch;
  timeoutMs?: number;
}
