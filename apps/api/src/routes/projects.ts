import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../session.js";

export async function projectRoutes(app: FastifyInstance) {
  app.get("/api/projects", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query(
      "SELECT * FROM content_projects WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 100",
      [s.user.id]
    );
    return rows;
  });

  app.post("/api/projects", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string | null>;
    const { rows } = await pool.query(
      `INSERT INTO content_projects (user_id, brand_id, type, title, body, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [s.user.id, b.brand_id || null, b.type || "written", b.title || "Untitled", b.body || "", b.status || "draft"]
    );
    return reply.status(201).send(rows[0]);
  });

  app.put("/api/projects/:id", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    const b = (req.body ?? {}) as Record<string, string | null>;
    const { rows } = await pool.query(
      `UPDATE content_projects SET brand_id=$1, type=$2, title=$3, body=$4, status=$5,
       updated_at=NOW() WHERE id=$6 AND user_id=$7 RETURNING *`,
      [b.brand_id || null, b.type, b.title, b.body, b.status, id, s.user.id]
    );
    if (!rows[0]) return reply.status(404).send({ error: "Not found" });
    return rows[0];
  });

  app.delete("/api/projects/:id", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    await pool.query("DELETE FROM content_projects WHERE id=$1 AND user_id=$2", [id, s.user.id]);
    return { ok: true };
  });
}
