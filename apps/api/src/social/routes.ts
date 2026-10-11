import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { redis } from "../redis.js";
import { requireUser } from "../session.js";
import { decryptToken, encryptToken } from "../crypto.js";
import { PLATFORMS, pkcePair } from "./platforms.js";

function redirectUri(key: string): string {
  return `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/social/${key}/callback`;
}

export async function socialRoutes(app: FastifyInstance) {
  app.get("/api/social/config", async () => {
    return Object.fromEntries(Object.values(PLATFORMS).map((p) => [p.key, p.configured()]));
  });

  app.get("/api/social", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query(
      `SELECT id, platform, account_id, account_name, expires_at, scopes, status, updated_at
       FROM social_connections WHERE user_id = $1 ORDER BY platform`,
      [s.user.id]
    );
    return rows;
  });

  app.get("/api/social/:platform/connect", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { platform } = req.params as { platform: string };
    const def = PLATFORMS[platform];
    if (!def) return reply.status(404).send({ error: "Unknown platform" });
    if (!def.configured()) {
      return reply.status(400).send({
        error: `${def.label} is not configured. Add its credentials to .env — see docs/social-connectors.md.`,
      });
    }
    const pair = platform === "x" ? pkcePair() : null;
    const state = randomUUID();
    await redis.setex(
      `oauth:${state}`,
      600,
      JSON.stringify({ userId: s.user.id, platform, verifier: pair?.verifier ?? "" })
    );
    return reply.redirect(
      def.authorizeUrl(state, pair ? { challenge: pair.challenge } : undefined)
    );
  });

  app.get("/api/social/:platform/callback", async (req, reply) => {
    const { platform } = req.params as { platform: string };
    const { code, state, error } = req.query as Record<string, string | undefined>;
    const home = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
    if (error || !code || !state) return reply.redirect(`${home}?social=error`);
    const def = PLATFORMS[platform];
    const saved = await redis.getdel(`oauth:${state}`);
    if (!def || !saved) return reply.redirect(`${home}?social=error`);
    const { userId, verifier } = JSON.parse(saved) as { userId: string; verifier?: string };
    try {
      const tokens = await def.exchange(code, redirectUri(platform), { verifier });
      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;
      await pool.query(
        `INSERT INTO social_connections
         (user_id, platform, account_id, account_name, access_token_enc, refresh_token_enc, expires_at, scopes, status, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'connected',NOW())
         ON CONFLICT (user_id, platform) DO UPDATE SET
           account_id=EXCLUDED.account_id, account_name=EXCLUDED.account_name,
           access_token_enc=EXCLUDED.access_token_enc, refresh_token_enc=EXCLUDED.refresh_token_enc,
           expires_at=EXCLUDED.expires_at, scopes=EXCLUDED.scopes,
           status='connected', updated_at=NOW()`,
        [
          userId,
          platform,
          tokens.account_id ?? "",
          tokens.account_name ?? `${def.label} account`,
          encryptToken(tokens.access_token),
          tokens.refresh_token ? encryptToken(tokens.refresh_token) : "",
          expiresAt,
          tokens.scopes ?? "",
        ]
      );
      return reply.redirect(`${home}?social=connected&platform=${platform}`);
    } catch (e) {
      req.log.error(e);
      return reply.redirect(`${home}?social=error`);
    }
  });

  app.delete("/api/social/:platform", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { platform } = req.params as { platform: string };
    await pool.query("DELETE FROM social_connections WHERE user_id=$1 AND platform=$2", [
      s.user.id,
      platform,
    ]);
    return { ok: true };
  });

  app.post("/api/social/:platform/refresh", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { platform } = req.params as { platform: string };
    const def = PLATFORMS[platform];
    if (!def) return reply.status(404).send({ error: "Unknown platform" });
    const found = await pool.query(
      "SELECT * FROM social_connections WHERE user_id=$1 AND platform=$2",
      [s.user.id, platform]
    );
    const row = found.rows[0];
    if (!row?.refresh_token_enc) {
      return reply.status(400).send({ error: "No refresh token stored — reconnect the account." });
    }
    try {
      const tokens = await def.refresh(decryptToken(row.refresh_token_enc));
      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;
      await pool.query(
        `UPDATE social_connections SET access_token_enc=$1, refresh_token_enc=$2,
         expires_at=$3, status='connected', updated_at=NOW() WHERE id=$4`,
        [
          encryptToken(tokens.access_token),
          tokens.refresh_token ? encryptToken(tokens.refresh_token) : row.refresh_token_enc,
          expiresAt,
          row.id,
        ]
      );
      return { ok: true };
    } catch (e) {
      await pool.query("UPDATE social_connections SET status='expired' WHERE id=$1", [row.id]);
      return reply.status(400).send({ error: e instanceof Error ? e.message : "Refresh failed" });
    }
  });
}
