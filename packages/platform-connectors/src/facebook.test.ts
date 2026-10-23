import { describe, expect, it } from "vitest";
import { createFacebookAdapter, getAdapter, createDryRunAdapter, listPages, mapGraphError, PublishError } from "./index.js";

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

interface Call { url: string; init: RequestInit }
function mockFetch(responder: (call: Call) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const f = (async (url: string | URL | Request, init?: RequestInit) => {
    const call = { url: String(url), init: init ?? {} };
    calls.push(call);
    return responder(call);
  }) as typeof fetch;
  return { f, calls };
}

const bodyOf = (c: Call) => new URLSearchParams(String(c.init.body));

describe("facebook publish", () => {
  it("posts text to the page feed and returns the post id and link", async () => {
    const { f, calls } = mockFetch(() => reply(200, { id: "123_456" }));
    const out = await createFacebookAdapter({ fetch: f }).publish({ accessToken: "PAGE_TOKEN", accountId: "123", text: "Hello Juba" });
    expect(out).toEqual({ externalId: "123_456", url: "https://www.facebook.com/123_456" });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/^https:\/\/graph\.facebook\.com\/v\d+\.\d+\/123\/feed$/);
    expect(bodyOf(calls[0]).get("message")).toBe("Hello Juba");
  });

  it("keeps the token out of the URL", async () => {
    const { f, calls } = mockFetch(() => reply(200, { id: "1_2" }));
    await createFacebookAdapter({ fetch: f }).publish({ accessToken: "SECRET_TOKEN", accountId: "1", text: "x" });
    expect(calls[0].url).not.toContain("SECRET_TOKEN");
    expect(bodyOf(calls[0]).get("access_token")).toBe("SECRET_TOKEN");
  });

  it("adds a link to a text post", async () => {
    const { f, calls } = mockFetch(() => reply(200, { id: "1_2" }));
    await createFacebookAdapter({ fetch: f }).publish({ accessToken: "t", accountId: "1", text: "Read this", link: "https://example.com" });
    expect(bodyOf(calls[0]).get("link")).toBe("https://example.com");
  });

  it("posts an image through the photos endpoint and prefers post_id", async () => {
    const { f, calls } = mockFetch(() => reply(200, { id: "photo1", post_id: "123_789" }));
    const out = await createFacebookAdapter({ fetch: f }).publish({ accessToken: "t", accountId: "123", text: "Look", imageUrl: "https://cdn.example.com/a.jpg" });
    expect(out.externalId).toBe("123_789");
    expect(calls[0].url).toMatch(/\/123\/photos$/);
    expect(bodyOf(calls[0]).get("url")).toBe("https://cdn.example.com/a.jpg");
    expect(bodyOf(calls[0]).get("caption")).toBe("Look");
  });

  it("refuses to call Facebook with no page or an empty post", async () => {
    const { f, calls } = mockFetch(() => reply(200, { id: "1" }));
    const a = createFacebookAdapter({ fetch: f });
    await expect(a.publish({ accessToken: "", accountId: "1", text: "x" })).rejects.toMatchObject({ kind: "auth", retryable: false });
    await expect(a.publish({ accessToken: "t", accountId: "1", text: "  " })).rejects.toMatchObject({ kind: "invalid" });
    expect(calls).toHaveLength(0);
  });

  it("fails clearly when Facebook returns no id", async () => {
    const { f } = mockFetch(() => reply(200, {}));
    await expect(createFacebookAdapter({ fetch: f }).publish({ accessToken: "t", accountId: "1", text: "x" })).rejects.toBeInstanceOf(PublishError);
  });
});

describe("error mapping", () => {
  const e = (status: number, code?: number, sub?: number, message = "m") => mapGraphError(status, { error: { code, error_subcode: sub, message } });

  it("expired token: not retryable, tells the user to reconnect", () => {
    const err = e(400, 190, 463);
    expect(err).toMatchObject({ kind: "auth", retryable: false, code: 190 });
    expect(err.message).toMatch(/Reconnect/);
  });
  it("permission problems are not retryable", () => {
    expect(e(403, 200)).toMatchObject({ kind: "permission", retryable: false });
    expect(e(400, 10)).toMatchObject({ kind: "permission", retryable: false });
    expect(e(400, 368)).toMatchObject({ kind: "permission", retryable: false });
  });
  it("rate limits and temporary errors are retryable", () => {
    expect(e(400, 4)).toMatchObject({ kind: "rate_limit", retryable: true });
    expect(e(400, 32)).toMatchObject({ kind: "rate_limit", retryable: true });
    expect(e(500, undefined)).toMatchObject({ kind: "server", retryable: true });
    expect(e(400, 2)).toMatchObject({ kind: "server", retryable: true });
  });
  it("invalid requests are not retryable and include Facebook's reason", () => {
    const err = e(400, 100, undefined, "(#100) Invalid parameter");
    expect(err).toMatchObject({ kind: "invalid", retryable: false });
    expect(err.message).toContain("Invalid parameter");
  });
  it("unknown errors are not retried blindly", () => {
    expect(e(400, 999)).toMatchObject({ kind: "unknown", retryable: false });
  });
  it("the messages never contain a token", () => {
    expect(mapGraphError(400, { error: { code: 190, message: "Error validating access token EAAB123SECRET" } }).message).not.toContain("EAAB123SECRET");
  });

  it("maps a failed HTTP call through the adapter", async () => {
    const { f } = mockFetch(() => reply(400, { error: { code: 190, message: "expired" } }));
    await expect(createFacebookAdapter({ fetch: f }).publish({ accessToken: "t", accountId: "1", text: "x" })).rejects.toMatchObject({ kind: "auth" });
  });
  it("a network failure is retryable", async () => {
    const { f } = mockFetch(() => { throw new TypeError("fetch failed"); });
    await expect(createFacebookAdapter({ fetch: f }).publish({ accessToken: "t", accountId: "1", text: "x" })).rejects.toMatchObject({ kind: "network", retryable: true });
  });
  it("a timeout is retryable", async () => {
    const f = ((_u: string, init?: RequestInit) =>
      new Promise((_res, rej) => {
        init?.signal?.addEventListener("abort", () => { const err = new Error("aborted"); err.name = "AbortError"; rej(err); });
      })) as unknown as typeof fetch;
    await expect(createFacebookAdapter({ fetch: f, timeoutMs: 20 }).publish({ accessToken: "t", accountId: "1", text: "x" })).rejects.toMatchObject({ kind: "network", retryable: true });
  });
});

describe("listPages", () => {
  it("returns pages, marks the ones that cannot post, and sends the token in a header", async () => {
    const { f, calls } = mockFetch(() => reply(200, { data: [
      { id: "1", name: "Juba Threads", access_token: "PT1", tasks: ["CREATE_CONTENT", "MANAGE"] },
      { id: "2", name: "Read Only Page", access_token: "PT2", tasks: ["ANALYZE"] },
      { id: "3", name: "No token" },
    ] }));
    const pages = await listPages("USER_TOKEN", { fetch: f });
    expect(pages).toEqual([
      { id: "1", name: "Juba Threads", accessToken: "PT1", canPost: true },
      { id: "2", name: "Read Only Page", accessToken: "PT2", canPost: false },
    ]);
    expect(calls[0].url).not.toContain("USER_TOKEN");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("Bearer USER_TOKEN");
  });
  it("throws a classified error when Facebook refuses", async () => {
    const { f } = mockFetch(() => reply(400, { error: { code: 190, message: "bad" } }));
    await expect(listPages("t", { fetch: f })).rejects.toMatchObject({ kind: "auth" });
  });
});

describe("registry", () => {
  it("only facebook has a real adapter today", () => {
    expect(getAdapter("facebook")?.platform).toBe("facebook");
    for (const p of ["x", "linkedin", "tiktok", "instagram", "whatsapp", "nope"]) expect(getAdapter(p)).toBeNull();
  });
  it("the dry-run adapter never calls the network and is marked", async () => {
    const out = await createDryRunAdapter("facebook").publish({ accessToken: "", accountId: "", text: "hi" });
    expect(out.dryRun).toBe(true);
    expect(out.externalId).toMatch(/^dryrun_facebook_/);
  });
});
