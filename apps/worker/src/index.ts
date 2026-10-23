import "./env.js";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { Pool } from "pg";
import { finishIfDone, runPublish, runReminder } from "./publish.js";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const dryRun = process.env.PUBLISH_DRY_RUN === "true";

const worker = new Worker(
  "publishing",
  async (job) => {
    const { jobId } = job.data as { jobId: string };
    if (job.name === "remind") return runReminder(jobId, pool);
    const maxAttempts = job.opts.attempts ?? 1;
    return runPublish(jobId, { db: pool, dryRun }, { attempt: job.attemptsMade + 1, maxAttempts });
  },
  { connection, concurrency: 5 }
);

worker.on("failed", async (job, err) => {
  console.error(`[worker] job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
  // Out of retries: close out the schedule so it does not hang.
  if (job && job.name === "publish" && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    const { jobId } = job.data as { jobId: string };
    const found = await pool.query("SELECT schedule_id FROM publishing_jobs WHERE id::text=$1", [jobId]).catch(() => null);
    const scheduleId = found?.rows[0]?.schedule_id;
    if (scheduleId) await finishIfDone(pool, String(scheduleId)).catch(() => {});
  }
});

async function shutdown() {
  await worker.close();
  await pool.end();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log(`One Link worker running: publishing queue.${dryRun ? " DRY RUN: nothing is sent to any platform." : ""}`);
