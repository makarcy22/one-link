import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../session.js";

export async function notificationRoutes(app: FastifyInstance) {
  app.get("/api/notifications", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query(
      `SELECT id, kind, title, body, link, read_at, created_at FROM notifications
       WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [s.user.id]
    );
    const unread = await pool.query(
      "SELECT COUNT(*)::int AS n FROM notifications WHERE user_id=$1 AND read_at IS NULL",
      [s.user.id]
    );
    return { items: rows, unread: unread.rows[0].n };
  });

  app.post("/api/notifications/read", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as { id?: string };
    if (b.id) {
      await pool.query("UPDATE notifications SET read_at=NOW() WHERE id=$1 AND user_id=$2 AND read_at IS NULL", [b.id, s.user.id]);
    } else {
      await pool.query("UPDATE notifications SET read_at=NOW() WHERE user_id=$1 AND read_at IS NULL", [s.user.id]);
    }
    return { ok: true };
  });

  app.delete("/api/notifications/:id", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    await pool.query("DELETE FROM notifications WHERE id=$1 AND user_id=$2", [id, s.user.id]);
    return { ok: true };
  });
}
