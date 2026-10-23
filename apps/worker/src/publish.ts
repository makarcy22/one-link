import { UnrecoverableError } from "bullmq";
import { createDryRunAdapter, getAdapter, PublishError, type Adapter } from "@one-link/platform-connectors";
import { isDirect, isPlatformKey, platformLabel, type PlatformKey } from "@one-link/shared";
import { createNotification, decryptToken, publicMediaUrl, type Queryable } from "@one-link/shared/node";

export interface Deps {
  db: Queryable;
  dryRun: boolean;
  /** Test hook. Defaults to the real adapters. */
  adapterFor?: (platform: PlatformKey) => Adapter | null;
  /** Test hook. Defaults to the token vault. */
  decrypt?: (enc: string) => string;
}

export interface AttemptInfo {
  attempt: number;
  maxAttempts: number;
}

/** The text that goes in the post body: caption, then hashtags. The link is sent separately. */
export function composeText(caption: string, hashtags: string[]): string {
  const tags = hashtags.join(" ");
  return [caption.trim(), tags].filter(Boolean).join("\n\n");
}

export function parseList(t: unknown): string[] {
  try {
    const v = JSON.parse(String(t ?? "[]"));
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Mark a schedule completed once none of its jobs are still waiting or running. */
export async function finishIfDone(db: Queryable, scheduleId: string) {
  const pending = await db.query(
    "SELECT COUNT(*)::int AS n FROM publishing_jobs WHERE schedule_id::text=$1 AND status IN ('queued','running')",
    [scheduleId]
  );
  if (Number(pending.rows[0]?.n) === 0) {
    await db.query("UPDATE schedules SET status='completed' WHERE id::text=$1 AND status<>'completed'", [scheduleId]);
  }
}

async function fail(deps: Deps, job: Record<string, any>, message: string, retryable: boolean, info: AttemptInfo): Promise<never> {
  await deps.db.query("UPDATE publishing_jobs SET status='failed', last_error=$1, updated_at=NOW() WHERE id=$2", [message.slice(0, 500), job.id]);
  const lastTry = !retryable || info.attempt >= info.maxAttempts;
  if (lastTry) {
    await createNotification(deps.db, {
      userId: job.user_id,
      kind: "publish_failed",
      title: `Could not post to ${platformLabel(job.platform)}`,
      body: message.slice(0, 300),
      link: "Planner",
    });
    await finishIfDone(deps.db, String(job.schedule_id));
  }
  if (retryable) throw new Error(message);
  throw new UnrecoverableError(message);
}

/** Publish one job. Throws to let the queue retry (or stop, for errors retrying cannot fix). */
export async function runPublish(jobId: string, deps: Deps, info: AttemptInfo): Promise<"done" | "skipped"> {
  const found = await deps.db.query("SELECT * FROM publishing_jobs WHERE id::text=$1", [jobId]);
  const job = found.rows[0] as Record<string, any> | undefined;
  // Cancelled (rows deleted) or already done (duplicate delivery): nothing to do.
  if (!job || job.status === "completed") return "skipped";

  await deps.db.query("UPDATE publishing_jobs SET status='running', attempts=attempts+1, updated_at=NOW() WHERE id=$1", [job.id]);

  const platform = String(job.platform);
  if (!isPlatformKey(platform) || !isDirect(platform)) {
    await deps.db.query(
      "UPDATE publishing_jobs SET status='manual', last_error=$1, updated_at=NOW() WHERE id=$2",
      [`${platform} is posted by you. Your post is prepared.`, job.id]
    );
    return "skipped";
  }

  const v = (await deps.db.query("SELECT * FROM post_variants WHERE schedule_id=$1 AND platform=$2", [String(job.schedule_id), platform])).rows[0] as
    | Record<string, any>
    | undefined;
  if (!v) return fail(deps, job, "There is nothing prepared to post. Open the post in Planner and save it again.", false, info);

  const text = composeText(String(v.caption ?? ""), parseList(v.hashtags));
  const link = String(v.link ?? "");

  let adapter: Adapter | null;
  let accessToken = "";
  let accountId = "";
  if (deps.dryRun) {
    adapter = createDryRunAdapter(platform);
  } else {
    adapter = (deps.adapterFor ?? ((p) => getAdapter(p)))(platform);
    if (!adapter) return fail(deps, job, `Automatic posting to ${platform} is not available yet.`, false, info);
    const page = (
      await deps.db.query(
        "SELECT page_id, page_token_enc, can_post FROM social_pages WHERE user_id=$1 AND platform=$2 AND selected LIMIT 1",
        [job.user_id, platform]
      )
    ).rows[0] as Record<string, any> | undefined;
    if (!page) {
      return fail(deps, job, "Choose which Facebook Page to post to in Profile, then try again.", false, info);
    }
    if (!page.can_post) return fail(deps, job, "Your role on this Page cannot create posts.", false, info);
    try {
      accessToken = (deps.decrypt ?? decryptToken)(String(page.page_token_enc));
    } catch {
      return fail(deps, job, "Your saved Facebook connection could not be read. Reconnect Facebook in Profile.", false, info);
    }
    accountId = String(page.page_id);
  }

  let imageUrl: string | undefined;
  if (v.media_id) {
    const m = (await deps.db.query("SELECT storage_key, kind FROM media_assets WHERE id::text=$1", [String(v.media_id)])).rows[0] as
      | Record<string, any>
      | undefined;
    if (m && String(m.kind) === "image") {
      const url = publicMediaUrl(String(m.storage_key));
      if (url) imageUrl = url;
      else if (!deps.dryRun) {
        return fail(
          deps,
          job,
          "This post has an image, but your files are stored on your own computer, which Facebook cannot reach. Turn on public file storage, or remove the image.",
          false,
          info
        );
      }
    }
  }

  try {
    const result = await adapter.publish({ accessToken, accountId, text, link: link || undefined, imageUrl });
    await deps.db.query(
      `UPDATE publishing_jobs SET status='completed', last_error='', external_id=$1, external_url=$2, dry_run=$3, updated_at=NOW() WHERE id=$4`,
      [result.externalId, result.url ?? "", Boolean(result.dryRun), job.id]
    );
    await createNotification(deps.db, {
      userId: job.user_id,
      kind: "published",
      title: result.dryRun ? `Test run finished for ${platformLabel(platform)}` : `Posted to ${platformLabel(platform)}`,
      body: result.dryRun ? "Nothing was sent. This was a test run." : text.slice(0, 140),
      link: "Planner",
      dedupeKey: `posted:${job.id}`,
    });
    await finishIfDone(deps.db, String(job.schedule_id));
    return "done";
  } catch (err) {
    if (err instanceof PublishError) return fail(deps, job, err.message, err.retryable, info);
    const message = err instanceof Error ? err.message : String(err);
    return fail(deps, job, `Unexpected error: ${message}`, true, info);
  }
}

/** "Time to post this yourself": for manual and coming-soon platforms. */
export async function runReminder(jobId: string, db: Queryable): Promise<void> {
  const job = (await db.query("SELECT * FROM publishing_jobs WHERE id::text=$1", [jobId])).rows[0] as Record<string, any> | undefined;
  if (!job || job.status !== "manual") return;
  const v = (await db.query("SELECT caption FROM post_variants WHERE schedule_id=$1 AND platform=$2", [String(job.schedule_id), job.platform])).rows[0];
  await createNotification(db, {
    userId: job.user_id,
    kind: "reminder",
    title: `Time to post on ${platformLabel(String(job.platform))}`,
    body: String(v?.caption ?? "Your post is ready to copy.").slice(0, 140),
    link: "Planner",
    dedupeKey: `remind:${job.id}`,
  });
  await finishIfDone(db, String(job.schedule_id));
}
