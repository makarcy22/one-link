import type { FastifyInstance } from "fastify";
import { GRAPHIC_TEMPLATES, CAPTION_STARTERS, THEMES, normalizeHashtags } from "@one-link/shared";
import { pool } from "../db.js";
import { requireUser } from "../session.js";

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

export async function libraryRoutes(app: FastifyInstance) {
  // Built-in starting points (no sign-in needed: they are the same for everyone).
  app.get("/api/library/builtin", async () => ({
    graphic_templates: GRAPHIC_TEMPLATES.map((t) => ({ id: t.id, name: t.name, fields: t.fields })),
    themes: THEMES,
    caption_starters: CAPTION_STARTERS,
  }));

  // ---- saved captions ----
  app.get("/api/library/captions", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query(
      "SELECT * FROM saved_captions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200",
      [s.user.id]
    );
    return rows.map((r) => ({ ...r, hashtags: safeList(r.hashtags) }));
  });

  app.post("/api/library/captions", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, unknown>;
    const body = clip(b.body, 5000);
    if (!body) return reply.status(400).send({ error: "Write the caption first." });
    const { rows } = await pool.query(
      `INSERT INTO saved_captions (user_id, title, body, hashtags, platform) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [s.user.id, clip(b.title, 120) || body.slice(0, 40), body, JSON.stringify(normalizeHashtags(asArray(b.hashtags))), clip(b.platform, 20)]
    );
    return reply.status(201).send({ ...rows[0], hashtags: safeList(rows[0].hashtags) });
  });

  app.delete("/api/library/captions/:id", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    await pool.query("DELETE FROM saved_captions WHERE id::text=$1 AND user_id=$2", [id, s.user.id]);
    return { ok: true };
  });

  // ---- user templates (saved graphic settings) ----
  app.get("/api/library/templates", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query(
      "SELECT * FROM user_templates WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",
      [s.user.id]
    );
    return rows.map((r) => ({ ...r, data: safeObj(r.data) }));
  });

  app.post("/api/library/templates", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, unknown>;
    const name = clip(b.name, 80);
    if (!name) return reply.status(400).send({ error: "Give the template a name." });
    const data = JSON.stringify(typeof b.data === "object" && b.data ? b.data : {}).slice(0, 20_000);
    const { rows } = await pool.query(
      `INSERT INTO user_templates (user_id, name, kind, data) VALUES ($1,$2,$3,$4) RETURNING *`,
      [s.user.id, name, clip(b.kind, 20) || "graphic", data]
    );
    return reply.status(201).send({ ...rows[0], data: safeObj(rows[0].data) });
  });

  app.delete("/api/library/templates/:id", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    await pool.query("DELETE FROM user_templates WHERE id::text=$1 AND user_id=$2", [id, s.user.id]);
    return { ok: true };
  });
}

function asArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function safeList(t: unknown): string[] {
  try { const v = JSON.parse(String(t ?? "[]")); return Array.isArray(v) ? v : []; } catch { return []; }
}
function safeObj(t: unknown): Record<string, unknown> {
  try { const v = JSON.parse(String(t ?? "{}")); return v && typeof v === "object" ? v : {}; } catch { return {}; }
}
