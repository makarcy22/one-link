import type { FastifyInstance } from "fastify";
import { REGIONS, PLATFORM_KEYS } from "@one-link/shared";
import { pool } from "../db.js";
import { requireUser } from "../session.js";
import { notify } from "../notify.js";

const ROLES = ["creator", "business", "agency", "other"];
const GOALS = ["grow_audience", "sell_more", "save_time", "stay_consistent", "learn_trends"];

function list(v: unknown, allowed?: readonly string[], max = 12): string[] {
  const arr = Array.isArray(v) ? v : [];
  const out = new Set<string>();
  for (const x of arr) {
    if (typeof x !== "string") continue;
    const k = x.trim().toLowerCase().slice(0, 40);
    if (k && (!allowed || allowed.includes(k))) out.add(k);
  }
  return [...out].slice(0, max);
}

function shape(row: Record<string, any> | undefined) {
  const parse = (t: unknown) => {
    try { const v = JSON.parse(String(t ?? "[]")); return Array.isArray(v) ? v : []; } catch { return []; }
  };
  return {
    role: row?.role ?? "",
    niche: row?.niche ?? "",
    region: row?.region ?? "global",
    goals: parse(row?.goals),
    platforms: parse(row?.platforms),
    onboarded: Boolean(row?.onboarded_at),
  };
}

export async function prefsRoutes(app: FastifyInstance) {
  app.get("/api/prefs", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const r = await pool.query("SELECT * FROM user_prefs WHERE user_id=$1", [s.user.id]);
    return shape(r.rows[0]);
  });

  app.put("/api/prefs", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, unknown>;
    const role = ROLES.includes(String(b.role)) ? String(b.role) : "";
    const niche = String(b.niche ?? "").trim().slice(0, 80);
    const region = REGIONS.some((r) => r.key === b.region) ? String(b.region) : "global";
    const goals = list(b.goals, GOALS);
    const platforms = list(b.platforms, PLATFORM_KEYS);
    const finish = b.finish === true;
    const r = await pool.query(
      `INSERT INTO user_prefs (user_id, role, niche, region, goals, platforms, onboarded_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6, CASE WHEN $7 THEN NOW() ELSE NULL END, NOW())
       ON CONFLICT (user_id) DO UPDATE SET role=$2, niche=$3, region=$4, goals=$5, platforms=$6,
         onboarded_at = CASE WHEN $7 THEN COALESCE(user_prefs.onboarded_at, NOW()) ELSE user_prefs.onboarded_at END,
         updated_at=NOW()
       RETURNING *`,
      [s.user.id, role, niche, region, JSON.stringify(goals), JSON.stringify(platforms), finish]
    );
    if (finish) {
      await notify(s.user.id, "welcome", "Welcome to One Link", "Your workspace is ready. Start by writing your first post.", "Create", "welcome");
    }
    return shape(r.rows[0]);
  });
}
