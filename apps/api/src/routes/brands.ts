import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../session.js";

export async function brandRoutes(app: FastifyInstance) {
  app.get("/api/brands", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query(
      "SELECT * FROM brands WHERE user_id = $1 ORDER BY created_at DESC",
      [s.user.id]
    );
    return rows;
  });

  app.post("/api/brands", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    const { rows } = await pool.query(
      `INSERT INTO brands (user_id, name, description, website, voice, colors, categories)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [s.user.id, b.name ?? "Untitled brand", b.description ?? "", b.website ?? "", b.voice ?? "Casual", b.colors ?? "[]", b.categories ?? "[]"]
    );
    return reply.status(201).send(rows[0]);
  });

  app.put("/api/brands/:id", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    const b = (req.body ?? {}) as Record<string, string>;
    const { rows } = await pool.query(
      `UPDATE brands SET name=$1, description=$2, website=$3, voice=$4, colors=$5,
       categories=$6, updated_at=NOW() WHERE id=$7 AND user_id=$8 RETURNING *`,
      [b.name, b.description, b.website, b.voice, b.colors, b.categories, id, s.user.id]
    );
    if (!rows[0]) return reply.status(404).send({ error: "Not found" });
    return rows[0];
  });

  app.delete("/api/brands/:id", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    await pool.query("DELETE FROM brands WHERE id=$1 AND user_id=$2", [id, s.user.id]);
    return { ok: true };
  });
}
