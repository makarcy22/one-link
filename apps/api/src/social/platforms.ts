// Platform OAuth definitions. Each platform activates automatically once its
// credentials are present in .env. Publishing calls are added in the review
// pass; token acquisition, storage, and refresh work now.

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  account_id?: string;
  account_name?: string;
  scopes?: string;
}

export interface PlatformDef {
  key: string;
  label: string;
  configured(): boolean;
  authorizeUrl(state: string, extra?: { challenge?: string }): string;
  exchange(code: string, redirectUri: string, extra?: { verifier?: string }): Promise<TokenSet>;
  refresh(refreshToken: string): Promise<TokenSet>;
}

function apiBase(): string {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

function redirectUri(key: string): string {
  return `${apiBase()}/api/social/${key}/callback`;
}

async function asJson(res: Response): Promise<Record<string, unknown>> {
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`OAuth failed (${res.status}): ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body;
}

const tiktok: PlatformDef = {
  key: "tiktok",
  label: "TikTok",
  configured: () => Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET),
  authorizeUrl: (state) =>
    `https://www.tiktok.com/v2/auth/authorize/?${new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY ?? "",
      scope: "user.info.basic,video.upload",
      response_type: "code",
      redirect_uri: redirectUri("tiktok"),
      state,
    })}`,
  exchange: async (code, redirect) => {
    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirect,
      }),
    });
    const b = await asJson(res);
    return {
      access_token: String(b.access_token ?? ""),
      refresh_token: String(b.refresh_token ?? ""),
      expires_in: Number(b.expires_in ?? 0),
      account_id: String(b.open_id ?? ""),
      account_name: "TikTok account",
      scopes: String(b.scope ?? ""),
    };
  },
  refresh: async (refreshToken) => {
    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    const b = await asJson(res);
    return {
      access_token: String(b.access_token ?? ""),
      refresh_token: String(b.refresh_token ?? refreshToken),
      expires_in: Number(b.expires_in ?? 0),
    };
  },
};

// Facebook + Instagram share the Meta OAuth app. Publishing scopes require
// Meta app review before they work for anyone but the app's own test users.
const META_SCOPES =
  "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish";
const GRAPH = "https://graph.facebook.com/v21.0";

function metaDef(key: "facebook" | "instagram", label: string): PlatformDef {
  return {
    key,
    label,
    configured: () => Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
    authorizeUrl: (state) =>
      `https://www.facebook.com/v21.0/dialog/oauth?${new URLSearchParams({
        client_id: process.env.META_APP_ID ?? "",
        redirect_uri: redirectUri(key),
        scope: META_SCOPES,
        response_type: "code",
        state,
      })}`,
    exchange: async (code, redirect) => {
      const short = await asJson(
        await fetch(
          `${GRAPH}/oauth/access_token?${new URLSearchParams({
            client_id: process.env.META_APP_ID ?? "",
            redirect_uri: redirect,
            client_secret: process.env.META_APP_SECRET ?? "",
            code,
          })}`
        )
      );
      const longLived = await asJson(
        await fetch(
          `${GRAPH}/oauth/access_token?${new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: process.env.META_APP_ID ?? "",
            client_secret: process.env.META_APP_SECRET ?? "",
            fb_exchange_token: String(short.access_token ?? ""),
          })}`
        )
      );
      return {
        access_token: String(longLived.access_token ?? ""),
        expires_in: Number(longLived.expires_in ?? 0),
        account_name: `${label} account`,
        scopes: META_SCOPES,
      };
    },
    refresh: async () => {
      throw new Error("Meta long-lived tokens last ~60 days; reconnect the account to renew.");
    },
  };
}

const linkedin: PlatformDef = {
  key: "linkedin",
  label: "LinkedIn",
  configured: () => Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
  authorizeUrl: (state) =>
    `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({
      response_type: "code",
      client_id: process.env.LINKEDIN_CLIENT_ID ?? "",
      redirect_uri: redirectUri("linkedin"),
      scope: "openid profile w_member_social",
      state,
    })}`,
  exchange: async (code, redirect) => {
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID ?? "",
        client_secret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
        redirect_uri: redirect,
      }),
    });
    const b = await asJson(res);
    return {
      access_token: String(b.access_token ?? ""),
      refresh_token: b.refresh_token ? String(b.refresh_token) : undefined,
      expires_in: Number(b.expires_in ?? 0),
      account_name: "LinkedIn account",
      scopes: "openid profile w_member_social",
    };
  },
  refresh: async (refreshToken) => {
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID ?? "",
        client_secret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
      }),
    });
    const b = await asJson(res);
    return {
      access_token: String(b.access_token ?? ""),
      refresh_token: b.refresh_token ? String(b.refresh_token) : refreshToken,
      expires_in: Number(b.expires_in ?? 0),
    };
  },
};

import { createHash, randomBytes } from "node:crypto";

// PKCE pair (required by X OAuth 2.0). Verifier travels in the Redis
// state record; only the challenge goes over the browser redirect.
export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

const X_SCOPES = "tweet.read tweet.write users.read offline.access";

function xBasic(): string {
  return Buffer.from(
    `${process.env.X_CLIENT_ID ?? ""}:${process.env.X_CLIENT_SECRET ?? ""}`
  ).toString("base64");
}

const x: PlatformDef = {
  key: "x",
  label: "X",
  configured: () => Boolean(process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET),
  authorizeUrl: (state, extra) =>
    `https://twitter.com/i/oauth2/authorize?${new URLSearchParams({
      response_type: "code",
      client_id: process.env.X_CLIENT_ID ?? "",
      redirect_uri: redirectUri("x"),
      scope: X_SCOPES,
      state,
      code_challenge: extra?.challenge ?? "",
      code_challenge_method: "S256",
    })}`,
  exchange: async (code, redirect, extra) => {
    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${xBasic()}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirect,
        code_verifier: extra?.verifier ?? "",
      }),
    });
    const b = await asJson(res);
    return {
      access_token: String(b.access_token ?? ""),
      refresh_token: b.refresh_token ? String(b.refresh_token) : undefined,
      expires_in: Number(b.expires_in ?? 0),
      account_name: "X account",
      scopes: X_SCOPES,
    };
  },
  refresh: async (refreshToken) => {
    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${xBasic()}`,
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    });
    const b = await asJson(res);
    return {
      access_token: String(b.access_token ?? ""),
      refresh_token: b.refresh_token ? String(b.refresh_token) : refreshToken,
      expires_in: Number(b.expires_in ?? 0),
    };
  },
};

// Real X posting call (text posts). Media upload is a separate multi-step flow,
// added when video/image posting is required. Needs an X API tier with write access.
export async function postToX(accessToken: string, text: string): Promise<string> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const b = await asJson(res);
  const data = b.data as Record<string, unknown> | undefined;
  return String(data?.id ?? "");
}

export const PLATFORMS: Record<string, PlatformDef> = {
  tiktok,
  facebook: metaDef("facebook", "Facebook"),
  instagram: metaDef("instagram", "Instagram"),
  linkedin,
  x,
};
