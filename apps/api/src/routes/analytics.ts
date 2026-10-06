import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../session.js";

export async function analyticsRoutes(app: FastifyInstance) {
  app.get("/api/analytics/summary", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query(
      `SELECT platform,
        COALESCE(SUM(views),0)::int AS views,
        COALESCE(SUM(reach),0)::int AS reach,
        COALESCE(SUM(likes),0)::int AS likes,
        COALESCE(SUM(comments),0)::int AS comments,
        COALESCE(SUM(shares),0)::int AS shares,
        COALESCE(SUM(saves),0)::int AS saves,
        COALESCE(MAX(followers),0)::int AS followers,
        COALESCE(AVG(engagement),0)::float AS engagement
       FROM analytics_snapshots WHERE user_id = $1 GROUP BY platform`,
      [s.user.id]
    );
    const totals = rows.reduce(
      (acc, r) => ({
        views: acc.views + r.views,
        reach: acc.reach + r.reach,
        likes: acc.likes + r.likes,
        comments: acc.comments + r.comments,
        shares: acc.shares + r.shares,
        saves: acc.saves + r.saves,
      }),
      { views: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
    );
    const coach =
      totals.views === 0
        ? "No performance data yet. Publish your first post to unlock coaching."
        : totals.saves > totals.shares
          ? "Your audience saves more than it shares — consider educational or reference-style content next."
          : "Sharing is strong — consider a follow-up on your best-performing topic this week.";
    return { by_platform: rows, totals, coach };
  });

  app.post("/api/analytics/ingest", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, number | string>;
    const { rows } = await pool.query(
      `INSERT INTO analytics_snapshots
       (user_id, platform, views, reach, likes, comments, shares, saves, followers, engagement)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [s.user.id, b.platform || "tiktok", b.views || 0, b.reach || 0, b.likes || 0,
       b.comments || 0, b.shares || 0, b.saves || 0, b.followers || 0, b.engagement || 0]
    );
    return reply.status(201).send(rows[0]);
  });
}
