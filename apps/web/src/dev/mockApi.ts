// A pretend One Link server that lives in the browser. It powers the preview and `npm run dev:mock`.
// It calls the same shared logic (caption fitting, hashtag scoring, trends) as the real API,
// so what you see here is what the real app will do. Nothing here talks to a real network.
import {
  PLANS, TRENDS, TRENDS_AS_OF, CATEGORIES, REGIONS, GRAPHIC_TEMPLATES, THEMES, CAPTION_STARTERS,
  adaptAll, adaptForPlatform, filterTrends, rankTrends, suggestHashtags, scoreHashtag, normalizeHashtags,
  upcomingEvents, isDirect, type TrendRef, type Variant,
} from "@one-link/shared";

type Any = Record<string, any>;
const now = () => Date.now();
const iso = (ms: number) => new Date(ms).toISOString();
let seq = 100;
const id = () => String(++seq);
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));
class ApiError extends Error {}

const H = 3600_000;
const db = {
  prefs: { role: "business", niche: "Fashion and tailoring", region: "south_sudan", goals: ["grow_audience", "sell_more"], platforms: ["facebook", "instagram"], onboarded: true } as Any,
  brand: { id: "b1", name: "Amira Atelier", description: "Made-to-measure kitenge in Juba", website: "https://example.com", voice: "Casual" } as Any,
  uploads: [{ id: "m1", kind: "image", filename: "new-jackets.jpg", mime: "image/jpeg", size_bytes: 482113 }] as Any[],
  captions: [{ id: "c1", title: "Friday drop", body: "Something new lands Friday. Here is a first look.", hashtags: ["#NewDrop", "#JubaFashion"], platform: "facebook", created_at: iso(now() - 86400000) }] as Any[],
  templates: [] as Any[],
  groups: [{ id: "g1", name: "Fashion basics", tags: "#Fashion #Style #OOTD" }] as Any[],
  projects: [{ id: "p1", title: "Autumn collection", body: "", type: "written", status: "draft" }] as Any[],
  schedules: [] as Any[],
  variants: [] as Any[],
  jobs: [] as Any[],
  notes: [
    { id: "n1", kind: "welcome", title: "Welcome to One Link", body: "Your workspace is ready. Start by writing your first post.", link: "Create", read_at: null, created_at: iso(now() - 2 * H) },
    { id: "n2", kind: "published", title: "Test run finished for Facebook", body: "Nothing was sent. This was a test run.", link: "Planner", read_at: null, created_at: iso(now() - 26 * H) },
  ] as Any[],
  social: [] as Any[],
  pages: [] as Any[],
  billing: { plan: "free", status: null as string | null, ends: null as string | null, pending: null as Any | null },
};

// Seed: one post tomorrow (Facebook posts itself, Instagram is prepared), one that went out earlier.
function seedSchedule(whenMs: number, text: string, platforms: string[], status: string, jobStatus: Record<string, string>) {
  const sid = id();
  db.schedules.push({ id: sid, platforms: JSON.stringify(platforms), scheduled_at: iso(whenMs), status });
  for (const v of adaptAll(text, platforms, { hashtags: ["#NewDrop", "#JubaFashion"] })) {
    db.variants.push({ schedule_id: sid, platform: v.platform, caption: v.caption, hashtags: v.hashtags, link: v.link });
  }
  for (const p of platforms) {
    const st = jobStatus[p] ?? "queued";
    db.jobs.push({
      id: id(), schedule_id: sid, platform: p, status: st, dry_run: st === "completed", external_url: "", attempts: st === "completed" ? 1 : 0,
      last_error: st === "manual" ? `Automatic posting to ${p[0].toUpperCase() + p.slice(1)} is coming soon. Your post is prepared and we will remind you when it is time.` : "",
    });
  }
}
seedSchedule(now() + 20 * H, "Something new lands Friday. Here is a first look at the autumn jackets, cut and sewn in Juba.", ["facebook", "instagram"], "scheduled", { facebook: "queued", instagram: "manual" });
seedSchedule(now() - 30 * H, "Thank you to everyone who came to our open day. See you next month!", ["facebook"], "completed", { facebook: "completed" });

const TREND_REFS: TrendRef[] = TRENDS.flatMap((t) => t.hashtags.map((tag) => ({ tag, topic: t.topic, momentum: t.momentum, platforms: t.platforms, regions: t.regions })));

function notify(kind: string, title: string, body = "", link = "") {
  db.notes.unshift({ id: id(), kind, title, body, link, read_at: null, created_at: iso(now()) });
}
const mediaKind = (mid?: string) => {
  const m = db.uploads.find((u) => u.id === mid);
  const k = m?.kind;
  return k === "image" || k === "video" || k === "audio" ? k : null;
};

function buildVariants(b: Any): Variant[] {
  const platforms: string[] = (b.platforms ?? []).map((x: string) => String(x).toLowerCase());
  const text = String(b.text ?? "").trim();
  if (!text) throw new ApiError("Write something to post first.");
  const hashtags = normalizeHashtags(b.hashtags ?? []);
  const media = mediaKind(b.media_id);
  const out: Variant[] = [];
  for (const p of platforms) {
    const o = b.variants?.[p];
    const v = o && typeof o.caption === "string"
      ? adaptForPlatform({ text: o.caption, platform: p, hashtags, link: b.link ?? "", media })
      : adaptAll(text, [p], { hashtags, link: b.link ?? "", media })[0];
    if (v) out.push(v);
  }
  return out;
}

function runJob(job: Any) {
  job.status = "running";
  setTimeout(() => {
    const sc = db.schedules.find((s) => s.id === job.schedule_id);
    job.status = "completed"; job.dry_run = true; job.last_error = ""; job.attempts += 1;
    notify("published", "Test run finished for Facebook", "Nothing was sent. This was a test run.", "Planner");
    if (sc && db.jobs.filter((j) => j.schedule_id === sc.id).every((j) => j.status !== "queued" && j.status !== "running")) sc.status = "completed";
  }, 1800);
}

function overview() {
  const upcoming = db.schedules.filter((s) => s.status === "scheduled").sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  return {
    next_posts: upcoming.slice(0, 5).map((s) => ({ id: s.id, platforms: s.platforms, scheduled_at: s.scheduled_at, status: s.status, caption: db.variants.find((v) => v.schedule_id === s.id)?.caption ?? null })),
    needs_attention: db.jobs.filter((j) => j.status === "failed" || j.status === "manual").slice(0, 6),
    counts: { scheduled: upcoming.length, published: db.schedules.filter((s) => s.status === "completed").length, drafts: db.projects.filter((p) => p.status === "draft").length },
    connected: db.social,
    onboarded: db.prefs.onboarded,
    niche: db.prefs.niche,
    events: upcomingEvents(new Date(), 30, db.prefs.region).slice(0, 4),
    unread: db.notes.filter((n) => !n.read_at).length,
  };
}

export async function mockUpload(file: File) {
  await delay(300);
  const kind = file.type.startsWith("video") ? "video" : file.type.startsWith("audio") ? "audio" : "image";
  const row = { id: id(), kind, filename: file.name, mime: file.type, size_bytes: file.size };
  db.uploads.unshift(row);
  return row;
}

export async function mockRequest(fullPath: string, method: string, body: Any = {}): Promise<any> {
  await delay();
  const [path, qs = ""] = fullPath.split("?");
  const q = new URLSearchParams(qs);
  const m = (re: RegExp) => path.match(re);
  let r: RegExpMatchArray | null;

  if (path === "/api/overview") return overview();
  if (path === "/api/prefs") {
    if (method === "PUT") { db.prefs = { ...db.prefs, role: body.role, niche: body.niche, region: body.region, goals: body.goals ?? [], platforms: body.platforms ?? [], onboarded: body.finish ? true : db.prefs.onboarded }; if (body.finish) notify("welcome", "Welcome to One Link", "Your workspace is ready. Start by writing your first post.", "Create"); }
    return db.prefs;
  }
  if (path === "/api/notifications") return { items: db.notes.slice(0, 50), unread: db.notes.filter((n) => !n.read_at).length };
  if (path === "/api/notifications/read") { for (const n of db.notes) if (!body.id || n.id === body.id) n.read_at ??= iso(now()); return { ok: true }; }

  if (path === "/api/trends") {
    const region = q.get("region") || db.prefs.region;
    const items = rankTrends(filterTrends({ platform: q.get("platform") ?? "all", category: q.get("category") ?? "all", region, q: q.get("q") ?? "" }), { niche: db.prefs.niche, region });
    return { source: "curated", as_of: TRENDS_AS_OF, note: "A hand-picked guide to what works, reviewed regularly. It is not live data from the platforms.", regions: REGIONS, categories: CATEGORIES, total: TRENDS.length, items, events: upcomingEvents(new Date(), 60, region) };
  }
  if (path === "/api/hashtags/suggest") {
    const ctx = { text: String(body.text ?? ""), platform: body.platform ?? "instagram", niche: db.prefs.niche, region: db.prefs.region, saved: [], trending: TREND_REFS };
    return { ...suggestHashtags(ctx, 12), checked: (body.check ?? []).map((t: string) => scoreHashtag(t, ctx)) };
  }
  if (path === "/api/hashtags") return method === "POST" ? (db.groups.unshift({ id: id(), name: body.name, tags: body.tags }), db.groups[0]) : db.groups;

  if (path === "/api/variants/preview") return { variants: buildVariants(body) };
  if (path === "/api/schedules" && method === "GET") {
    return db.schedules.slice().sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)).map((s) => ({ ...s, variants: db.variants.filter((v) => v.schedule_id === s.id), jobs: db.jobs.filter((j) => j.schedule_id === s.id) }));
  }
  if (path === "/api/schedules" && method === "POST") {
    const variants = buildVariants(body);
    const bad = variants.find((v) => v.blockers.length);
    if (bad) throw new ApiError(`${bad.platform}: ${bad.blockers[0]}`);
    const sid = id();
    const platforms = variants.map((v) => v.platform);
    const sc = { id: sid, platforms: JSON.stringify(platforms), scheduled_at: body.scheduled_at, status: "scheduled" };
    db.schedules.push(sc);
    for (const v of variants) {
      db.variants.push({ schedule_id: sid, platform: v.platform, caption: v.caption, hashtags: v.hashtags, link: v.link });
      const direct = isDirect(v.platform);
      db.jobs.push({ id: id(), schedule_id: sid, platform: v.platform, status: direct ? "queued" : "manual", dry_run: false, external_url: "", attempts: 0,
        last_error: direct ? "" : `Automatic posting to ${v.platform[0].toUpperCase() + v.platform.slice(1)} is coming soon. Your post is prepared and we will remind you when it is time.` });
    }
    return sc;
  }
  if ((r = m(/^\/api\/schedules\/([^/]+)\/publish-now$/))) {
    const sc = db.schedules.find((s) => s.id === r![1]);
    if (!sc) throw new ApiError("Not found");
    sc.status = "publishing";
    for (const j of db.jobs.filter((x) => x.schedule_id === sc.id)) if (j.status === "queued" || j.status === "failed") runJob(j);
    if (!db.jobs.some((j) => j.schedule_id === sc.id && (j.status === "running"))) sc.status = "completed";
    return { schedule_id: sc.id };
  }
  if ((r = m(/^\/api\/schedules\/([^/]+)$/))) {
    const sc = db.schedules.find((s) => s.id === r![1]);
    if (!sc) throw new ApiError("Not found");
    if (method === "PUT") { sc.scheduled_at = body.scheduled_at; return sc; }
    if (method === "DELETE") { db.schedules = db.schedules.filter((s) => s !== sc); db.jobs = db.jobs.filter((j) => j.schedule_id !== sc.id); db.variants = db.variants.filter((v) => v.schedule_id !== sc.id); return { ok: true }; }
  }
  if ((r = m(/^\/api\/publishing-jobs\/([^/]+)\/(retry|mark-posted)$/))) {
    const j = db.jobs.find((x) => x.id === r![1]);
    if (!j) throw new ApiError("Not found");
    if (r[2] === "mark-posted") { j.status = "completed"; j.last_error = ""; } else runJob(j);
    const sc = db.schedules.find((s) => s.id === j.schedule_id);
    if (sc && db.jobs.filter((x) => x.schedule_id === sc.id).every((x) => x.status === "completed")) sc.status = "completed";
    return j;
  }
  if (path === "/api/publishing-jobs") return db.jobs;

  if (path === "/api/projects") return method === "POST" ? (db.projects.unshift({ id: id(), title: body.title, body: body.body, type: body.type, status: body.status }), db.projects[0]) : db.projects;
  if (path === "/api/media") return db.uploads;
  if ((r = m(/^\/api\/media\/([^/]+)$/)) && method === "DELETE") { db.uploads = db.uploads.filter((u) => u.id !== r![1]); return { ok: true }; }
  if (path === "/api/brands") return method === "POST" ? Object.assign(db.brand, body) : [db.brand];
  if ((r = m(/^\/api\/brands\/([^/]+)$/))) return Object.assign(db.brand, body);

  if (path === "/api/library/builtin") return { graphic_templates: GRAPHIC_TEMPLATES, themes: THEMES, caption_starters: CAPTION_STARTERS };
  if (path === "/api/library/captions") {
    if (method === "POST") { db.captions.unshift({ id: id(), title: body.title || String(body.body).slice(0, 40), body: body.body, hashtags: normalizeHashtags(body.hashtags ?? []), platform: body.platform ?? "", created_at: iso(now()) }); return db.captions[0]; }
    return db.captions;
  }
  if ((r = m(/^\/api\/library\/captions\/([^/]+)$/))) { db.captions = db.captions.filter((c) => c.id !== r![1]); return { ok: true }; }
  if (path === "/api/library/templates") {
    if (method === "POST") { db.templates.unshift({ id: id(), name: body.name, kind: body.kind, data: body.data, created_at: iso(now()) }); return db.templates[0]; }
    return db.templates;
  }
  if ((r = m(/^\/api\/library\/templates\/([^/]+)$/))) { db.templates = db.templates.filter((t) => t.id !== r![1]); return { ok: true }; }

  if (path === "/api/social/config") return { facebook: true, instagram: true, tiktok: false, linkedin: false, x: false };
  if (path === "/api/social") return db.social;
  if (path === "/api/social/facebook/pages") return db.pages;
  if (path === "/api/social/facebook/pages/select") {
    for (const p of db.pages) p.selected = p.page_id === body.page_id;
    const sel = db.pages.find((p) => p.selected);
    const c = db.social.find((s) => s.platform === "facebook");
    if (c && sel) c.account_name = sel.page_name;
    return { ok: true };
  }
  if ((r = m(/^\/api\/social\/([^/]+)\/(connect|refresh)$/))) return { ok: true };
  if ((r = m(/^\/api\/social\/([^/]+)$/)) && method === "DELETE") { db.social = db.social.filter((s) => s.platform !== r![1]); if (r[1] === "facebook") db.pages = []; return { ok: true }; }

  if (path === "/api/billing/status") {
    const b = db.billing;
    return {
      plan: b.plan, used: 7, limit: (PLANS as Any)[b.plan].aiMonthly, renews_or_ends: b.ends, provider: b.plan === "free" ? null : "manual", status: b.status,
      providers: ["manual", "flutterwave", "stripe"],
      // Example prices for the preview only. In the real app these follow the live exchange rate for the person's country.
      country: "SS", fx_attribution: { text: "Rates by Exchange Rate API", url: "https://www.exchangerate-api.com" },
      currency_options: {
        manual: [{ code: "USD", label: "US dollars", creator: 15, business: 49 }, { code: "SSP", label: "South Sudanese pounds", creator: 89000, business: 290000, estimated: true, as_of: iso(now() - 30 * H) }],
        flutterwave: [{ code: "USD", label: "US dollars", creator: 15, business: 49 }, { code: "UGX", label: "Ugandan shillings", creator: 61000, business: 197000, estimated: true, as_of: iso(now() - 30 * H) }],
        stripe: [{ code: "USD", label: "US dollars", creator: 15, business: 49 }],
        paystack: [{ code: "USD", label: "US dollars", creator: 15, business: 49 }],
      }, manual_instructions: "Send the amount to MTN MoMo 09XX XXX XXX (name: One Link).\nThen enter the transaction reference from the confirmation message.",
      plans: Object.values(PLANS).map((p) => ({ id: p.id, label: p.label, blurb: p.blurb, features: p.features, ai_monthly: p.aiMonthly, price_usd: p.id === "free" ? 0 : p.id === "creator" ? 15 : 49 })),
      pending_request: b.pending, is_admin: false,
    };
  }
  if (path === "/api/billing/checkout") return { provider: body.provider, url: "" };
  if (path === "/api/billing/manual") { db.billing.pending = { plan: body.plan, reference: body.reference }; return { ok: true }; }

  if (path === "/api/analytics/summary") {
    return { by_platform: [{ platform: "facebook", views: 4820, engagement: 0.06 }, { platform: "instagram", views: 2310, engagement: 0.08 }], totals: { views: 7130, reach: 5210, likes: 412, comments: 58, shares: 61, saves: 97 }, coach: "Your audience saves more than it shares. Try a reference-style post this week, such as a sizing guide or care tips." };
  }
  if (path === "/api/ai/caption") return { caption: `${String(body.text).trim()}\n\nTell us what you think in the comments.`, hashtags: ["#JubaFashion", "#NewDrop"] };
  if (path === "/api/ai/hooks") return { hooks: [`Nobody tells you this about ${body.topic}…`, `3 mistakes to avoid when it comes to ${body.topic}`, `Here is what I wish I knew about ${body.topic}`] };
  if (path === "/api/ai/ideas") return { ideas: [`A day in the life of a ${body.niche || "small"} business`, "Before and after of a customer order", "Answer the three questions you hear most"] };
  if (path === "/api/ai/ask") return { answer: "Post a short behind-the-scenes clip around 6 pm on weekdays, when most of your audience is online. Then reuse the best frame as a graphic." };

  throw new ApiError(`Not available in the preview: ${method} ${path}`);
}

/** Preview helper: pretend the person already connected Facebook with two Pages. */
export function connectDemoFacebook() {
  db.social = [{ platform: "facebook", account_name: "Facebook account", status: "connected", expires_at: null }];
  db.pages = [
    { page_id: "1", page_name: "Amira Atelier", can_post: true, selected: false },
    { page_id: "2", page_name: "Juba Tailors Club", can_post: true, selected: false },
    { page_id: "3", page_name: "Old shop page", can_post: false, selected: false },
  ];
}
