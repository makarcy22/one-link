import type { FastifyInstance } from "fastify";
import { upcomingEvents } from "@one-link/shared";
import { pool } from "../db.js";
import { requireUser } from "../session.js";

// One call for the Home screen: what is next, what needs attention, and what to do today.
export async function overviewRoutes(app: FastifyInstance) {
  app.get("/api/overview", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const uid = s.user.id;
    const [next, attention, counts, connected, prefs, drafts, unread] = await Promise.all([
      pool.query(
        `SELECT sc.id, sc.platforms, sc.scheduled_at, sc.status,
                (SELECT caption FROM post_variants v WHERE v.schedule_id = sc.id::text ORDER BY v.platform LIMIT 1) AS caption
         FROM schedules sc WHERE sc.user_id=$1 AND sc.status='scheduled' AND sc.scheduled_at >= NOW() - INTERVAL '5 minutes'
         ORDER BY sc.scheduled_at ASC LIMIT 5`,
        [uid]
      ),
      pool.query(
        `SELECT id, schedule_id, platform, status, last_error, updated_at FROM publishing_jobs
         WHERE user_id=$1 AND status IN ('failed','manual') ORDER BY updated_at DESC LIMIT 6`,
        [uid]
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status='scheduled')::int AS scheduled,
           COUNT(*) FILTER (WHERE status='completed')::int AS published
         FROM schedules WHERE user_id=$1`,
        [uid]
      ),
      pool.query("SELECT platform, account_name, status FROM social_connections WHERE user_id=$1", [uid]),
      pool.query("SELECT * FROM user_prefs WHERE user_id=$1", [uid]),
      pool.query("SELECT COUNT(*)::int AS n FROM content_projects WHERE user_id=$1 AND status='draft'", [uid]),
      pool.query("SELECT COUNT(*)::int AS n FROM notifications WHERE user_id=$1 AND read_at IS NULL", [uid]),
    ]);
    const region = prefs.rows[0]?.region ?? "global";
    return {
      next_posts: next.rows,
      needs_attention: attention.rows,
      counts: { ...counts.rows[0], drafts: drafts.rows[0].n },
      connected: connected.rows,
      onboarded: Boolean(prefs.rows[0]?.onboarded_at),
      niche: prefs.rows[0]?.niche ?? "",
      events: upcomingEvents(new Date(), 30, region).slice(0, 4),
      unread: unread.rows[0].n,
    };
  });
}
