import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../session.js";
import { removeFile, saveUpload } from "../storage.js";

export async function mediaRoutes(app: FastifyInstance) {
  app.get("/api/media", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query(
      "SELECT * FROM media_assets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100",
      [s.user.id]
    );
    return rows;
  });

  app.post("/api/media/upload", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const file = await req.file();
    if (!file) return reply.status(400).send({ error: "No file uploaded" });
    const buf = await file.toBuffer();
    const kind = (file.mimetype || "").startsWith("image/")
      ? "image"
      : (file.mimetype || "").startsWith("audio/")
        ? "audio"
        : "video";
    const key = await saveUpload("originals", file.filename || "upload", buf);
    const { rows } = await pool.query(
      `INSERT INTO media_assets (user_id, kind, filename, storage_key, mime, size_bytes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [s.user.id, kind, file.filename || "upload", key, file.mimetype || "", buf.length]
    );
    return reply.status(201).send(rows[0]);
  });

  app.delete("/api/media/:id", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    const found = await pool.query(
      "SELECT storage_key FROM media_assets WHERE id=$1 AND user_id=$2",
      [id, s.user.id]
    );
    if (found.rows[0]) await removeFile(found.rows[0].storage_key);
    await pool.query("DELETE FROM media_assets WHERE id=$1 AND user_id=$2", [id, s.user.id]);
    return { ok: true };
  });
}
