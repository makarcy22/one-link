import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../session.js";

export async function hashtagRoutes(app: FastifyInstance) {
  app.get("/api/hashtags", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query(
      "SELECT * FROM hashtag_groups WHERE user_id = $1 ORDER BY created_at DESC",
      [s.user.id]
    );
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
}
