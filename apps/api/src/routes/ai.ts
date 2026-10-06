import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../session.js";

// Template-based generation engine. Works with zero API keys so every phase
// is testable end to end; a real model provider plugs in here in the review pass.

const HOOKS = [
  (t: string) => `Nobody tells you this before ${t}…`,
  (t: string) => `Stop doing ${t} until you see this.`,
  (t: string) => `I tried ${t} for 7 days — here is what happened.`,
  (t: string) => `The ${t} mistake almost everyone makes.`,
  (t: string) => `POV: you finally figured out ${t}.`,
];

const IDEAS = [
  "Teaser countdown: three short clips building to launch day.",
  "Behind the scenes: show the process, not just the result.",
  "Customer story: turn your best comment into a quote graphic.",
  "Myth vs fact: correct one common misconception in your niche.",
  "Price reveal: announce one offer with a clear call to action.",
];

async function record(userId: string, kind: string, input: string, output: string) {
  await pool.query(
    "INSERT INTO ai_generations (user_id, kind, input, output) VALUES ($1,$2,$3,$4)",
    [userId, kind, input, output]
  );
}

export async function aiRoutes(app: FastifyInstance) {
  app.post("/api/ai/caption", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    const text = b.text || "my new post";
    const tone = b.tone || "Casual";
    const platform = b.platform || "tiktok";
    let brandVoice = "Casual";
    if (b.brand_id) {
      const r = await pool.query("SELECT voice FROM brands WHERE id=$1 AND user_id=$2", [b.brand_id, s.user.id]);
      if (r.rows[0]?.voice) brandVoice = r.rows[0].voice;
    }
    const caption = `${text} — told in a ${tone.toLowerCase()} voice${brandVoice !== tone ? ` with your ${brandVoice.toLowerCase()} brand touch` : ""}, tuned for ${platform}.`;
    const hashtags = ["#NewPost", "#Creator", "#OneLink"];
    await record(s.user.id, "caption", JSON.stringify(b), caption);
    return { caption, hashtags };
  });

  app.post("/api/ai/hooks", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    const topic = b.topic || "starting a business";
    const hooks = HOOKS.map((f) => f(topic));
    await record(s.user.id, "hooks", topic, hooks.join("\n"));
    return { hooks };
  });

  app.post("/api/ai/ideas", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    const niche = b.niche || "your niche";
    const ideas = IDEAS.map((i) => `${i} (Angle: ${niche}.)`);
    await record(s.user.id, "ideas", niche, ideas.join("\n"));
    return { ideas };
  });

  app.post("/api/ai/ask", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    const q = (b.question || "").toLowerCase();
    let answer = "Here is a good next step: pick one trend from your niche, create a short video around it, and schedule it for your audience's most active hour.";
    if (q.includes("post today") || q.includes("what should")) {
      answer = "Post one short video today: a hook in the first 2 seconds, one clear idea, and a call to action. Repurpose your best recent post with a fresh opening line.";
    } else if (q.includes("hashtag")) {
      answer = "Use 3–5 hashtags: 1 broad, 2 niche, 1 branded (like your own brand tag). Relevance beats popularity — check your saved hashtag groups first.";
    } else if (q.includes("why") && (q.includes("perform") || q.includes("poor") || q.includes("bad"))) {
      answer = "Check three things: the first 2 seconds (hook strength), watch completion (pacing), and posting time vs your audience activity. Then test one change at a time.";
    } else if (q.includes("when") || q.includes("time")) {
      answer = "Start with 7 PM in your audience time zone, then adjust using your own analytics after a week of consistent posting.";
    }
    await record(s.user.id, "ask", b.question || "", answer);
    return { answer };
  });
}
