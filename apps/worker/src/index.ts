import "./env.js";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { Pool } from "pg";
import { mockPublish } from "./mock.js";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

new Worker(
  "publishing",
  async (job) => {
    const { jobId } = job.data as { jobId: string };
    await pool.query(
      "UPDATE publishing_jobs SET status='running', attempts=attempts+1, updated_at=NOW() WHERE id=$1",
      [jobId]
    );
    const found = await pool.query(
      `SELECT pj.*, sc.platforms FROM publishing_jobs pj
       JOIN schedules sc ON sc.id = pj.schedule_id WHERE pj.id=$1`,
      [jobId]
    );
    const row = found.rows[0];
    if (!row) return;
    const result = await mockPublish(row.platform, `scheduled post ${row.schedule_id}`);
    await pool.query(
      "UPDATE publishing_jobs SET status=$1, last_error=$2, external_id=$3, updated_at=NOW() WHERE id=$4",
      [result.ok ? "completed" : "failed", result.ok ? "" : result.message, result.externalId, jobId]
    );
    const pending = await pool.query(
      "SELECT COUNT(*)::int AS n FROM publishing_jobs WHERE schedule_id=$1 AND status IN ('queued','running')",
      [row.schedule_id]
    );
    if (pending.rows[0].n === 0) {
      await pool.query("UPDATE schedules SET status='completed' WHERE id=$1", [row.schedule_id]);
    }
  },
  { connection }
);

console.log("One Link worker running: publishing queue.");
