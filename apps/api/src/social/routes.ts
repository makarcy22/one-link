import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { redis } from "../redis.js";
import { requireUser } from "../session.js";
import { decryptToken, encryptToken } from "../crypto.js";
import { listPages } from "@one-link/platform-connectors";
import { PLATFORMS, pkcePair } from "./platforms.js";
import { notify } from "../notify.js";

/** Save the Facebook Pages this person manages. Page tokens are encrypted like every other token. */
async function syncFacebookPages(userId: string, userToken: string): Promise<number> {
  const pages = await listPages(userToken);
  const keep = pages.map((p) => p.id);
  await pool.query(
    "DELETE FROM social_pages WHERE user_id=$1 AND platform='facebook' AND NOT (page_id = ANY($2::text[]))",
    [userId, keep]
  );
  for (const p of pages) {
    await pool.query(
      `INSERT INTO social_pages (user_id, platform, page_id, page_name, page_token_enc, can_post, updated_at)
       VALUES ($1,'facebook',$2,$3,$4,$5,NOW())
       ON CONFLICT (user_id, platform, page_id) DO UPDATE SET
         page_name=EXCLUDED.page_name, page_token_enc=EXCLUDED.page_token_enc, can_post=EXCLUDED.can_post, updated_at=NOW()`,
      [userId, p.id, p.name, encryptToken(p.accessToken), p.canPost]
    );
  }
  // One postable Page: pick it automatically. Otherwise the person chooses.
  const selected = await pool.query("SELECT 1 FROM social_pages WHERE user_id=$1 AND platform='facebook' AND selected", [userId]);
  const postable = pages.filter((p) => p.canPost);
  if (!selected.rows[0] && postable.length === 1) {
    await pool.query("UPDATE social_pages SET selected=TRUE WHERE user_id=$1 AND platform='facebook' AND page_id=$2", [userId, postable[0].id]);
    await pool.query("UPDATE social_connections SET account_id=$2, account_name=$3 WHERE user_id=$1 AND platform='facebook'", [userId, postable[0].id, postable[0].name]);
  }
  // Keep the connection row showing the chosen Page (a reconnect resets it).
  await pool.query(
    `UPDATE social_connections sc SET account_id=sp.page_id, account_name=sp.page_name
     FROM social_pages sp WHERE sc.user_id=$1 AND sc.platform='facebook'
       AND sp.user_id=$1 AND sp.platform='facebook' AND sp.selected`,
    [userId]
  );
  return pages.length;
}

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

  // Facebook Pages the person manages, and which one One Link posts to. Tokens are never sent to the browser.
  app.get("/api/social/facebook/pages", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query(
      "SELECT page_id, page_name, can_post, selected FROM social_pages WHERE user_id=$1 AND platform='facebook' ORDER BY page_name",
      [s.user.id]
    );
    return rows;
  });

  app.post("/api/social/facebook/pages/select", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { page_id } = (req.body ?? {}) as { page_id?: string };
    const page = await pool.query(
      "SELECT page_id, page_name, can_post FROM social_pages WHERE user_id=$1 AND platform='facebook' AND page_id=$2",
      [s.user.id, page_id ?? ""]
    );
    if (!page.rows[0]) return reply.status(404).send({ error: "Page not found." });
    if (!page.rows[0].can_post) return reply.status(400).send({ error: "Your role on this Page cannot create posts." });
    await pool.query("UPDATE social_pages SET selected = (page_id=$2) WHERE user_id=$1 AND platform='facebook'", [s.user.id, page_id]);
    await pool.query("UPDATE social_connections SET account_id=$2, account_name=$3 WHERE user_id=$1 AND platform='facebook'", [
      s.user.id, page.rows[0].page_id, page.rows[0].page_name,
    ]);
    return { ok: true };
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
      let pageCount = -1;
      if (platform === "facebook") {
        try {
          pageCount = await syncFacebookPages(userId, tokens.access_token);
        } catch (e) {
          req.log.error({ error: String(e) }, "Could not list Facebook Pages");
          await notify(userId, "connection", "Facebook connected, but no Pages found", "We could not read your Pages. Reconnect and allow Page access.", "Profile");
        }
      }
      return reply.redirect(`${home}?social=connected&platform=${platform}${pageCount >= 0 ? `&pages=${pageCount}` : ""}`);
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
    await pool.query("DELETE FROM social_pages WHERE user_id=$1 AND platform=$2", [s.user.id, platform]);
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
