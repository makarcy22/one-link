import type { FastifyInstance } from "fastify";
import { TRENDS, scoreHashtag, suggestHashtags, normalizeHashtags, type TrendRef } from "@one-link/shared";
import { pool } from "../db.js";
import { requireUser } from "../session.js";

const TREND_REFS: TrendRef[] = TRENDS.flatMap((t) =>
  t.hashtags.map((tag) => ({ tag, topic: t.topic, momentum: t.momentum, platforms: t.platforms, regions: t.regions }))
);

export async function hashtagRoutes(app: FastifyInstance) {
  app.get("/api/hashtags", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query("SELECT * FROM hashtag_groups WHERE user_id = $1 ORDER BY created_at DESC", [s.user.id]);
    return rows;
  });

  app.post("/api/hashtags", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    const { rows } = await pool.query(
      "INSERT INTO hashtag_groups (user_id, name, tags) VALUES ($1,$2,$3) RETURNING *",
      [s.user.id, b.name || "Untitled group", b.tags || ""]
    );
    return reply.status(201).send(rows[0]);
  });

  app.delete("/api/hashtags/:id", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    await pool.query("DELETE FROM hashtag_groups WHERE id=$1 AND user_id=$2", [id, s.user.id]);
    return { ok: true };
  });

  // Suggest tags for a post and explain why each one fits (or does not).
  app.post("/api/hashtags/suggest", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, unknown>;
    const prefs = (await pool.query("SELECT niche, region FROM user_prefs WHERE user_id=$1", [s.user.id])).rows[0];
    const groups = (await pool.query("SELECT tags FROM hashtag_groups WHERE user_id=$1 LIMIT 50", [s.user.id])).rows;
    const saved = normalizeHashtags(groups.flatMap((g) => String(g.tags ?? "").split(/[\s,]+/).filter(Boolean)));
    const ctx = {
      text: typeof b.text === "string" ? b.text.slice(0, 5000) : "",
      platform: typeof b.platform === "string" ? b.platform : "instagram",
      niche: typeof b.niche === "string" ? b.niche : prefs?.niche ?? "",
      region: typeof b.region === "string" ? b.region : prefs?.region ?? "global",
      saved,
      trending: TREND_REFS,
    };
    const result = suggestHashtags(ctx, 12);
    const check = Array.isArray(b.check)
      ? normalizeHashtags(b.check.filter((x): x is string => typeof x === "string")).map((t) => scoreHashtag(t, ctx))
      : [];
    return { ...result, checked: check };
  });
}
