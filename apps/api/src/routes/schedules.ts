import type { FastifyInstance } from "fastify";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { pool } from "../db.js";
import { requireUser } from "../session.js";
import { platformMode } from "../connectors.js";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});
const publishingQueue = new Queue("publishing", { connection });

export async function scheduleRoutes(app: FastifyInstance) {
  app.get("/api/schedules", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query(
      `SELECT sc.*, cp.title AS project_title
       FROM schedules sc LEFT JOIN content_projects cp ON cp.id = sc.project_id
       WHERE sc.user_id = $1 ORDER BY sc.scheduled_at ASC LIMIT 100`,
      [s.user.id]
    );
    return rows;
  });

  app.post("/api/schedules", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    const { rows } = await pool.query(
      `INSERT INTO schedules (user_id, project_id, platforms, scheduled_at, status)
       VALUES ($1,$2,$3,$4,'scheduled') RETURNING *`,
      [s.user.id, b.project_id || null, b.platforms || "[]", b.scheduled_at]
    );
    return reply.status(201).send(rows[0]);
  });

  app.post("/api/schedules/:id/publish-now", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { id } = req.params as { id: string };
    const found = await pool.query(
      "SELECT * FROM schedules WHERE id=$1 AND user_id=$2",
      [id, s.user.id]
    );
    const schedule = found.rows[0];
    if (!schedule) return reply.status(404).send({ error: "Not found" });
    const platforms: string[] = JSON.parse(schedule.platforms || "[]");
    const jobs = [];
    for (const platform of platforms) {
      const mode = platformMode(platform);
      if (mode === "manual") {
        const ins = await pool.query(
          `INSERT INTO publishing_jobs (user_id, schedule_id, platform, status, last_error)
           VALUES ($1,$2,$3,'manual', $4) RETURNING *`,
          [s.user.id, id, platform, `${platform} requires manual posting; export prepared.`]
        );
        jobs.push(ins.rows[0]);
        continue;
      }
      const ins = await pool.query(
        `INSERT INTO publishing_jobs (user_id, schedule_id, platform, status)
         VALUES ($1,$2,$3,'queued') RETURNING *`,
        [s.user.id, id, platform]
      );
      await publishingQueue.add("publish", { jobId: ins.rows[0].id });
      jobs.push(ins.rows[0]);
    }
    await pool.query("UPDATE schedules SET status='publishing' WHERE id=$1", [id]);
    return { schedule_id: id, jobs };
  });

  app.get("/api/publishing-jobs", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const { rows } = await pool.query(
      "SELECT * FROM publishing_jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100",
      [s.user.id]
    );
    return rows;
  });
}
