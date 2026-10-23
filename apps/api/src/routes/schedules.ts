import type { FastifyInstance } from "fastify";
import {
  adaptAll,
  adaptForPlatform,
  isDirect,
  normalizeHashtags,
  platformLabel,
  type Variant,
} from "@one-link/shared";
import { pool } from "../db.js";
import { requireUser } from "../session.js";
import { platformMode } from "../connectors.js";
import { MAX_HORIZON_MS, delayUntil, parsePlatforms, parseWhen } from "../scheduling.js";
import { dequeueAll, enqueuePublish, enqueueReminder } from "../publish-queue.js";

type MediaKind = "image" | "video" | "audio" | null;

async function mediaKindFor(userId: string, mediaId: unknown): Promise<{ id: string | null; kind: MediaKind; error?: string }> {
  if (typeof mediaId !== "string" || !mediaId) return { id: null, kind: null };
  const r = await pool.query("SELECT id, kind FROM media_assets WHERE id::text=$1 AND user_id=$2", [mediaId, userId]);
  if (!r.rows[0]) return { id: null, kind: null, error: "That file was not found in your library." };
  const kind = String(r.rows[0].kind);
  return { id: String(r.rows[0].id), kind: kind === "image" || kind === "video" || kind === "audio" ? kind : null };
}

interface Draft {
  text: string;
  hashtags: string[];
  link: string;
  mediaId: string | null;
  media: MediaKind;
  overrides: Record<string, { caption?: string; hashtags?: string[]; link?: string }>;
}

/** Build the per-platform previews from what the person typed. Used by both preview and create. */
function buildVariants(platforms: string[], d: Draft): Variant[] {
  const out: Variant[] = [];
  for (const p of platforms) {
    const o = d.overrides[p];
    if (o && typeof o.caption === "string") {
      const v = adaptForPlatform({ text: o.caption, platform: p, hashtags: o.hashtags ?? d.hashtags, link: o.link ?? d.link, media: d.media });
      if (v) out.push(v);
    } else {
      out.push(...adaptAll(d.text, [p], { hashtags: d.hashtags, link: d.link, media: d.media }));
    }
  }
  return out;
}

async function readDraft(userId: string, b: Record<string, unknown>): Promise<{ draft?: Draft; error?: string }> {
  let text = typeof b.text === "string" ? b.text.trim() : "";
  const projectId = typeof b.project_id === "string" && b.project_id ? b.project_id : null;
  if (!text && projectId) {
    const r = await pool.query("SELECT body FROM content_projects WHERE id::text=$1 AND user_id=$2", [projectId, userId]);
    text = String(r.rows[0]?.body ?? "").trim();
  }
  if (!text) return { error: "Write something to post first." };
  if (text.length > 20_000) return { error: "That text is too long." };
  const m = await mediaKindFor(userId, b.media_id);
  if (m.error) return { error: m.error };
  const overrides: Draft["overrides"] = {};
  if (b.variants && typeof b.variants === "object") {
    for (const [k, v] of Object.entries(b.variants as Record<string, unknown>)) {
      if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        overrides[k.toLowerCase()] = {
          caption: typeof o.caption === "string" ? o.caption : undefined,
          hashtags: Array.isArray(o.hashtags) ? normalizeHashtags(o.hashtags.filter((x): x is string => typeof x === "string")) : undefined,
          link: typeof o.link === "string" ? o.link : undefined,
        };
      }
    }
  }
  return {
    draft: {
      text,
      hashtags: Array.isArray(b.hashtags) ? normalizeHashtags(b.hashtags.filter((x): x is string => typeof x === "string")) : [],
      link: typeof b.link === "string" ? b.link.trim().slice(0, 500) : "",
      mediaId: m.id,
      media: m.kind,
      overrides,
    },
  };
}

/** Create the publishing_jobs row for one platform and queue what it needs. */
async function createJob(userId: string, scheduleId: string, platform: string, delayMs: number) {
  if (platformMode(platform) !== "direct") {
    const why =
      platformMode(platform) === "soon"
        ? `Automatic posting to ${platformLabel(platform)} is coming soon. Your post is prepared and we will remind you when it is time.`
        : `${platformLabel(platform)} is posted by you. Your post is prepared and we will remind you when it is time.`;
    const ins = await pool.query(
      `INSERT INTO publishing_jobs (user_id, schedule_id, platform, status, last_error)
       VALUES ($1,$2,$3,'manual',$4) RETURNING *`,
      [userId, scheduleId, platform, why]
    );
    const row = ins.rows[0];
    try {
      await enqueueReminder(row.id, delayMs);
    } catch {
      /* the post is still prepared; the reminder is a convenience */
    }
    return row;
  }
  const ins = await pool.query(
    `INSERT INTO publishing_jobs (user_id, schedule_id, platform, status) VALUES ($1,$2,$3,'queued') RETURNING *`,
    [userId, scheduleId, platform]
  );
  const row = ins.rows[0];
  try {
    await enqueuePublish(row.id, delayMs);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Queue unavailable";
    const failed = await pool.query(
      "UPDATE publishing_jobs SET status='failed', last_error=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
      [`Could not reach the publishing queue: ${message}`, row.id]
    );
    return failed.rows[0];
  }
  return row;
}

export async function scheduleRoutes(app: FastifyInstance) {
  // Live preview: what each platform will actually receive. Nothing is saved.
  app.post("/api/variants/preview", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, unknown>;
    const platforms = parsePlatforms(b.platforms);
    if (platforms.length === 0) return reply.status(400).send({ error: "Pick at least one platform." });
    const { draft, error } = await readDraft(s.user.id, b);
    if (!draft) return reply.status(400).send({ error });
    return { variants: buildVariants(platforms, draft) };
  });

  app.get("/api/schedules", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query(
      `SELECT sc.*, cp.title AS project_title
       FROM schedules sc LEFT JOIN content_projects cp ON cp.id = sc.project_id
       WHERE sc.user_id = $1 ORDER BY sc.scheduled_at ASC LIMIT 100`,
      [s.user.id]
    );
    const ids = rows.map((r) => String(r.id));
    const variants = ids.length
      ? (await pool.query("SELECT * FROM post_variants WHERE schedule_id = ANY($1::text[])", [ids])).rows
      : [];
    const jobs = ids.length
      ? (await pool.query(
          `SELECT id, schedule_id, platform, status, last_error, external_id, external_url, dry_run, attempts, updated_at
           FROM publishing_jobs WHERE schedule_id::text = ANY($1::text[])`,
          [ids]
        )).rows
      : [];
    return rows.map((r) => ({
      ...r,
      variants: variants.filter((v) => v.schedule_id === String(r.id)).map((v) => ({ ...v, hashtags: safeList(v.hashtags) })),
      jobs: jobs.filter((j) => String(j.schedule_id) === String(r.id)),
    }));
  });

  // Create a schedule with one reviewed variant per platform.
  app.post("/api/schedules", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, unknown>;

    const platforms = parsePlatforms(b.platforms);
    if (platforms.length === 0) return reply.status(400).send({ error: "Pick at least one supported platform." });
    const when = parseWhen(b.scheduled_at);
    if (!when) return reply.status(400).send({ error: "scheduled_at must be a valid date and time." });
    if (when.getTime() - Date.now() > MAX_HORIZON_MS) {
      return reply.status(400).send({ error: "You can schedule at most one year ahead." });
    }

    const projectId = typeof b.project_id === "string" && b.project_id ? b.project_id : null;
    if (projectId) {
      const own = await pool.query("SELECT 1 FROM content_projects WHERE id::text=$1 AND user_id=$2", [projectId, s.user.id]);
      if (!own.rows[0]) return reply.status(404).send({ error: "Project not found." });
    }
    const { draft, error } = await readDraft(s.user.id, b);
    if (!draft) return reply.status(400).send({ error });

    const variants = buildVariants(platforms, draft);
    const blocked = variants.filter((v) => v.blockers.length > 0);
    if (blocked.length > 0) {
      return reply.status(422).send({
        error: blocked.map((v) => `${v.platform}: ${v.blockers[0]}`).join(" "),
        blockers: blocked.map((v) => ({ platform: v.platform, blockers: v.blockers })),
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO schedules (user_id, project_id, platforms, scheduled_at, status)
       VALUES ($1,$2,$3,$4,'scheduled') RETURNING *`,
      [s.user.id, projectId, JSON.stringify(platforms), when.toISOString()]
    );
    const schedule = rows[0];
    for (const v of variants) {
      await pool.query(
        `INSERT INTO post_variants (user_id, schedule_id, platform, caption, hashtags, link, media_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [s.user.id, String(schedule.id), v.platform, v.caption, JSON.stringify(v.hashtags), v.link, draft.mediaId]
      );
    }
    const delay = delayUntil(when);
    const jobs = [];
    for (const platform of platforms) jobs.push(await createJob(s.user.id, String(schedule.id), platform, delay));
    return reply.status(201).send({ ...schedule, variants, jobs });
  });

  // Edit one platform's caption before it goes out.
  app.put("/api/schedules/:id/variants/:platform", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id, platform } = req.params as { id: string; platform: string };
    const b = (req.body ?? {}) as Record<string, unknown>;
    const found = await pool.query("SELECT status FROM schedules WHERE id::text=$1 AND user_id=$2", [id, s.user.id]);
    if (!found.rows[0]) return reply.status(404).send({ error: "Not found" });
    if (found.rows[0].status !== "scheduled") return reply.status(409).send({ error: "This post has already started publishing." });
    const old = await pool.query("SELECT * FROM post_variants WHERE schedule_id=$1 AND platform=$2 AND user_id=$3", [id, platform, s.user.id]);
    if (!old.rows[0]) return reply.status(404).send({ error: "That platform is not part of this post." });
    const media = await mediaKindFor(s.user.id, old.rows[0].media_id);
    const v = adaptForPlatform({
      text: typeof b.caption === "string" ? b.caption : old.rows[0].caption,
      platform,
      hashtags: Array.isArray(b.hashtags) ? normalizeHashtags(b.hashtags.filter((x): x is string => typeof x === "string")) : safeList(old.rows[0].hashtags),
      link: typeof b.link === "string" ? b.link : old.rows[0].link,
      media: media.kind,
    });
    if (!v) return reply.status(400).send({ error: "Unknown platform." });
    if (v.blockers.length) return reply.status(422).send({ error: v.blockers[0], blockers: v.blockers });
    await pool.query(
      "UPDATE post_variants SET caption=$1, hashtags=$2, link=$3, updated_at=NOW() WHERE schedule_id=$4 AND platform=$5 AND user_id=$6",
      [v.caption, JSON.stringify(v.hashtags), v.link, id, platform, s.user.id]
    );
    return v;
  });

  // Move a schedule to a new time (only before it has started publishing).
  app.put("/api/schedules/:id", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    const b = (req.body ?? {}) as Record<string, unknown>;
    const when = parseWhen(b.scheduled_at);
    if (!when) return reply.status(400).send({ error: "scheduled_at must be a valid date and time." });
    if (when.getTime() - Date.now() > MAX_HORIZON_MS) {
      return reply.status(400).send({ error: "You can schedule at most one year ahead." });
    }
    const found = await pool.query("SELECT * FROM schedules WHERE id::text=$1 AND user_id=$2", [id, s.user.id]);
    const schedule = found.rows[0];
    if (!schedule) return reply.status(404).send({ error: "Not found" });
    if (schedule.status !== "scheduled") {
      return reply.status(409).send({ error: "Only a post that has not started publishing can be moved." });
    }
    const updated = await pool.query("UPDATE schedules SET scheduled_at=$1 WHERE id::text=$2 AND user_id=$3 RETURNING *", [when.toISOString(), id, s.user.id]);
    const waiting = await pool.query(
      "SELECT id, status FROM publishing_jobs WHERE schedule_id::text=$1 AND user_id=$2 AND status IN ('queued','manual')",
      [id, s.user.id]
    );
    const delay = delayUntil(when);
    for (const job of waiting.rows) {
      if (job.status === "queued") await enqueuePublish(job.id, delay);
      else await enqueueReminder(job.id, delay);
    }
    return updated.rows[0];
  });

  // Cancel a schedule that has not started publishing.
  app.delete("/api/schedules/:id", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    const found = await pool.query("SELECT * FROM schedules WHERE id::text=$1 AND user_id=$2", [id, s.user.id]);
    const schedule = found.rows[0];
    if (!schedule) return reply.status(404).send({ error: "Not found" });
    if (schedule.status !== "scheduled") {
      return reply.status(409).send({ error: "Only a post that has not started publishing can be cancelled." });
    }
    const jobs = await pool.query("SELECT id FROM publishing_jobs WHERE schedule_id::text=$1 AND user_id=$2", [id, s.user.id]);
    for (const job of jobs.rows) await dequeueAll(job.id);
    await pool.query("DELETE FROM publishing_jobs WHERE schedule_id::text=$1 AND user_id=$2", [id, s.user.id]);
    await pool.query("DELETE FROM post_variants WHERE schedule_id=$1 AND user_id=$2", [id, s.user.id]);
    await pool.query("DELETE FROM schedules WHERE id::text=$1 AND user_id=$2", [id, s.user.id]);
    return { ok: true };
  });

  // Publish now: waiting jobs run immediately; missing ones are created.
  app.post("/api/schedules/:id/publish-now", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    const found = await pool.query("SELECT * FROM schedules WHERE id::text=$1 AND user_id=$2", [id, s.user.id]);
    const schedule = found.rows[0];
    if (!schedule) return reply.status(404).send({ error: "Not found" });
    if (schedule.status === "publishing" || schedule.status === "completed") {
      return reply.status(409).send({ error: "This post is already publishing or published." });
    }
    const platforms = parsePlatforms(schedule.platforms);
    const existing = await pool.query("SELECT * FROM publishing_jobs WHERE schedule_id::text=$1 AND user_id=$2", [id, s.user.id]);
    const byPlatform = new Map<string, { id: string; status: string }>(existing.rows.map((r: { platform: string; id: string; status: string }) => [r.platform, r]));

    const jobs = [];
    for (const platform of platforms) {
      const row = byPlatform.get(platform);
      if (row && (row.status === "queued" || row.status === "failed") && isDirect(platform)) {
        const reset = await pool.query(
          "UPDATE publishing_jobs SET status='queued', last_error='', updated_at=NOW() WHERE id=$1 RETURNING *",
          [row.id]
        );
        await enqueuePublish(row.id, 0);
        jobs.push(reset.rows[0]);
      } else if (row && row.status === "manual") {
        await enqueueReminder(row.id, 0).catch(() => {});
        jobs.push(row);
      } else if (!row) {
        jobs.push(await createJob(s.user.id, id, platform, 0));
      } else {
        jobs.push(row);
      }
    }
    await pool.query("UPDATE schedules SET status='publishing' WHERE id::text=$1", [id]);
    return { schedule_id: id, jobs };
  });

  app.get("/api/publishing-jobs", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query("SELECT * FROM publishing_jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100", [s.user.id]);
    return rows;
  });

  // Try a failed post again.
  app.post("/api/publishing-jobs/:id/retry", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    const r = await pool.query("SELECT * FROM publishing_jobs WHERE id::text=$1 AND user_id=$2", [id, s.user.id]);
    const job = r.rows[0];
    if (!job) return reply.status(404).send({ error: "Not found" });
    if (job.status !== "failed") return reply.status(409).send({ error: "Only a failed post can be retried." });
    const up = await pool.query(
      "UPDATE publishing_jobs SET status='queued', last_error='', attempts=0, updated_at=NOW() WHERE id=$1 RETURNING *",
      [job.id]
    );
    await pool.query("UPDATE schedules SET status='publishing' WHERE id::text=$1", [String(job.schedule_id)]);
    await enqueuePublish(job.id, 0);
    return up.rows[0];
  });

  // The person posted a manual/prepared post themselves.
  app.post("/api/publishing-jobs/:id/mark-posted", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    const up = await pool.query(
      `UPDATE publishing_jobs SET status='completed', last_error='', updated_at=NOW()
       WHERE id::text=$1 AND user_id=$2 AND status='manual' RETURNING *`,
      [id, s.user.id]
    );
    if (!up.rows[0]) return reply.status(404).send({ error: "Nothing to mark." });
    const pending = await pool.query(
      "SELECT COUNT(*)::int AS n FROM publishing_jobs WHERE schedule_id::text=$1 AND status IN ('queued','running','manual')",
      [String(up.rows[0].schedule_id)]
    );
    if (pending.rows[0].n === 0) await pool.query("UPDATE schedules SET status='completed' WHERE id::text=$1", [String(up.rows[0].schedule_id)]);
    return up.rows[0];
  });
}

function safeList(t: unknown): string[] {
  try { const v = JSON.parse(String(t ?? "[]")); return Array.isArray(v) ? v : []; } catch { return []; }
}
