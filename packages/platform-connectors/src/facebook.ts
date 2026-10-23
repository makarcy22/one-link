import { PublishError, type Adapter, type AdapterOptions, type PublishRequest, type PublishResult } from "./types.js";

// Facebook Pages publishing through the Graph API.
// Posting to a Page needs a PAGE access token and the pages_manage_posts permission.
// Until the app passes Meta's review, only people with a role on the app can post.

export const DEFAULT_GRAPH_VERSION = "v24.0";

export function graphVersion(): string {
  return process.env.META_GRAPH_VERSION?.trim() || DEFAULT_GRAPH_VERSION;
}

interface GraphErrorBody {
  error?: { message?: string; type?: string; code?: number; error_subcode?: number };
}

/** Turns a Graph API failure into a classified error with a message a person can act on. */
export function mapGraphError(status: number, body: unknown): PublishError {
  const err = (body as GraphErrorBody | null)?.error;
  const code = err?.code;
  const sub = err?.error_subcode;
  const extra = { status, code };

  if (code === 190 || sub === 458 || sub === 460 || sub === 463 || sub === 467) {
    return new PublishError("Facebook says the connection expired or was revoked. Reconnect your Facebook Page in Profile.", "auth", false, extra);
  }
  if (code === 368) {
    return new PublishError("Facebook blocked this post as possible spam. Edit the text and try again later.", "permission", false, extra);
  }
  if (code === 10 || (code !== undefined && code >= 200 && code <= 299)) {
    return new PublishError("One Link does not have permission to post to this Page. Reconnect and approve posting, and check your role on the Page. The Meta app may also need review.", "permission", false, extra);
  }
  if (code === 4 || code === 17 || code === 32 || code === 613 || (code !== undefined && code >= 80000 && code <= 80014)) {
    return new PublishError("Facebook is limiting how often this Page can post. One Link will try again shortly.", "rate_limit", true, extra);
  }
  if (code === 100) {
    return new PublishError(`Facebook rejected the post: ${err?.message ?? "invalid request"}`, "invalid", false, extra);
  }
  if (code === 1 || code === 2 || status >= 500) {
    return new PublishError("Facebook had a temporary problem. One Link will try again shortly.", "server", true, extra);
  }
  if (status === 401 || status === 403) {
    return new PublishError("Facebook refused the request. Reconnect your Facebook Page in Profile.", "auth", false, extra);
  }
  return new PublishError(`Facebook could not publish this post${err?.message ? `: ${err.message}` : "."}`, "unknown", false, extra);
}

async function call(
  f: typeof fetch,
  timeoutMs: number,
  path: string,
  token: string,
  form: Record<string, string>
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    // The token travels in the request body, never in the URL, so it cannot end up in access logs.
    res = await f(`https://graph.facebook.com/${graphVersion()}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ ...form, access_token: token }),
      signal: controller.signal,
    });
  } catch (e) {
    const timedOut = e instanceof Error && e.name === "AbortError";
    throw new PublishError(
      timedOut ? "Facebook took too long to answer. One Link will try again shortly." : "Could not reach Facebook. One Link will try again shortly.",
      "network",
      true
    );
  } finally {
    clearTimeout(timer);
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || (body as GraphErrorBody).error) throw mapGraphError(res.status, body);
  return body;
}

export function createFacebookAdapter(opts: AdapterOptions = {}): Adapter {
  const f = opts.fetch ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 20_000;
  return {
    platform: "facebook",
    async publish(req: PublishRequest): Promise<PublishResult> {
      if (!req.accessToken || !req.accountId) {
        throw new PublishError("No Facebook Page is connected. Connect one in Profile.", "auth", false);
      }
      if (!req.text.trim() && !req.imageUrl) {
        throw new PublishError("The post is empty.", "invalid", false);
      }
      let body: Record<string, unknown>;
      if (req.imageUrl) {
        body = await call(f, timeoutMs, `${encodeURIComponent(req.accountId)}/photos`, req.accessToken, {
          url: req.imageUrl,
          caption: req.link ? `${req.text}\n\n${req.link}` : req.text,
          published: "true",
        });
      } else {
        const form: Record<string, string> = { message: req.text };
        if (req.link) form.link = req.link;
        body = await call(f, timeoutMs, `${encodeURIComponent(req.accountId)}/feed`, req.accessToken, form);
      }
      const id = String(body.post_id ?? body.id ?? "");
      if (!id) throw new PublishError("Facebook accepted the request but did not return a post id.", "unknown", false);
      return { externalId: id, url: `https://www.facebook.com/${id}` };
    },
  };
}

export interface FacebookPage {
  id: string;
  name: string;
  /** Page access token. Treat as a secret and encrypt before storing. */
  accessToken: string;
  /** False when the person has a role on the Page that cannot create posts. */
  canPost: boolean;
}

/** Lists the Pages a person manages, using their (long-lived) user token. */
export async function listPages(userToken: string, opts: AdapterOptions = {}): Promise<FacebookPage[]> {
  const f = opts.fetch ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20_000);
  try {
    const url = `https://graph.facebook.com/${graphVersion()}/me/accounts?${new URLSearchParams({ fields: "id,name,access_token,tasks", limit: "100" })}`;
    const res = await f(url, { headers: { Authorization: `Bearer ${userToken}` }, signal: controller.signal });
    const body = (await res.json().catch(() => ({}))) as { data?: { id?: string; name?: string; access_token?: string; tasks?: string[] }[] } & GraphErrorBody;
    if (!res.ok || body.error) throw mapGraphError(res.status, body);
    return (body.data ?? [])
      .filter((p) => p.id && p.access_token)
      .map((p) => ({
        id: String(p.id),
        name: String(p.name ?? "Facebook Page"),
        accessToken: String(p.access_token),
        canPost: !p.tasks || p.tasks.includes("CREATE_CONTENT"),
      }));
  } catch (e) {
    if (e instanceof PublishError) throw e;
    throw new PublishError("Could not reach Facebook to list your Pages.", "network", true);
  } finally {
    clearTimeout(timer);
  }
}
