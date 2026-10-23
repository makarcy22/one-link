import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../session.js";
import { createReadStream } from "node:fs";
import path from "node:path";
import { publicMediaUrl } from "@one-link/shared/node";
import { removeFile, saveUpload } from "../storage.js";
import { checkUpload } from "../upload-validation.js";

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

  // Show one of your own files. Local storage streams from disk; R2 redirects to its public address.
  app.get("/api/media/:id/file", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    const found = await pool.query("SELECT storage_key, mime FROM media_assets WHERE id::text=$1 AND user_id=$2", [id, s.user.id]);
    const row = found.rows[0];
    if (!row) return reply.status(404).send({ error: "Not found" });
    const pub = publicMediaUrl(row.storage_key);
    if (pub) return reply.redirect(pub);
    if ((process.env.STORAGE_DRIVER ?? "local") === "r2") return reply.status(404).send({ error: "File is not publicly reachable." });
    const root = path.resolve(process.env.STORAGE_LOCAL_DIR ?? "./storage");
    const full = path.resolve(root, row.storage_key);
    if (!full.startsWith(root + path.sep)) return reply.status(400).send({ error: "Bad path" });
    reply.header("Content-Type", row.mime || "application/octet-stream");
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Cache-Control", "private, max-age=300");
    return reply.send(createReadStream(full));
  });

  app.post("/api/media/upload", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const file = await req.file();
    if (!file) return reply.status(400).send({ error: "No file uploaded" });

    let buf: Buffer;
    try {
      buf = await file.toBuffer();
    } catch {
      // @fastify/multipart throws when the file exceeds the configured size limit.
      return reply.status(413).send({ error: "File is too large (limit 100 MB)." });
    }
    if (file.file.truncated) {
      return reply.status(413).send({ error: "File is too large (limit 100 MB)." });
    }

    const check = checkUpload(file.mimetype || "", buf);
    if (!check.ok) return reply.status(check.status).send({ error: check.error });

    const filename = file.filename || "upload";
    const key = await saveUpload("originals", filename, buf);
    const { rows } = await pool.query(
      `INSERT INTO media_assets (user_id, kind, filename, storage_key, mime, size_bytes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [s.user.id, check.kind, filename, key, file.mimetype || "", buf.length]
    );
    return reply.status(201).send(rows[0]);
  });

  app.delete("/api/media/:id", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    const found = await pool.query(
      "SELECT storage_key FROM media_assets WHERE id::text=$1 AND user_id=$2",
      [id, s.user.id]
    );
    if (found.rows[0]) await removeFile(found.rows[0].storage_key);
    await pool.query("DELETE FROM media_assets WHERE id::text=$1 AND user_id=$2", [id, s.user.id]);
    return { ok: true };
  });
}
