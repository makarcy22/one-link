import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { JOB_OPTIONS, jobKey, reminderKey } from "./scheduling.js";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});
export const publishingQueue = new Queue("publishing", { connection });

async function removeIfThere(key: string) {
  const existing = await publishingQueue.getJob(key);
  if (existing) await existing.remove().catch(() => {});
}

/** (Re)schedule the publish job for one publishing_jobs row. Safe to call twice. */
export async function enqueuePublish(publishingJobId: string, delayMs: number) {
  const key = jobKey(publishingJobId);
  await removeIfThere(key);
  await publishingQueue.add("publish", { jobId: publishingJobId }, { jobId: key, delay: delayMs, ...JOB_OPTIONS });
}

/** (Re)schedule the "time to post this yourself" reminder for a manual job. */
export async function enqueueReminder(publishingJobId: string, delayMs: number) {
  const key = reminderKey(publishingJobId);
  await removeIfThere(key);
  await publishingQueue.add("remind", { jobId: publishingJobId }, { jobId: key, delay: delayMs, removeOnComplete: true, removeOnFail: 100 });
}

export async function dequeueAll(publishingJobId: string) {
  await removeIfThere(jobKey(publishingJobId));
  await removeIfThere(reminderKey(publishingJobId));
}
