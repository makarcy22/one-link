import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../session.js";
import { groqChat, groqConfigured } from "../ai-provider.js";

// Template engine: zero-key fallback so every phase stays testable.
// When GROQ_API_KEY is set, the real model answers instead.

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

async function record(
  userId: string,
  kind: string,
  input: string,
  output: string,
  tokensIn = 0,
  tokensOut = 0,
  model = "template"
) {
  await pool.query(
    "INSERT INTO ai_generations (user_id, kind, input, output, tokens_in, tokens_out, model) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [userId, kind, input, output, tokensIn, tokensOut, model]
  );
}

async function brandVoiceOf(userId: string, brandId?: string): Promise<string> {
  if (!brandId) return "Casual";
  const r = await pool.query("SELECT voice FROM brands WHERE id=$1 AND user_id=$2", [brandId, userId]);
  return r.rows[0]?.voice || "Casual";
}

function parseCaption(text: string): { caption: string; hashtags: string[] } {
  const lines = text.split("\n");
  const capLine = lines.find((l) => /^caption\s*:/i.test(l)) ?? lines[0] ?? "";
  const tagLine = lines.find((l) => /^hashtags?\s*:/i.test(l)) ?? "";
  return {
    caption: capLine.replace(/^caption\s*:/i, "").trim() || text.trim(),
    hashtags: tagLine
      .replace(/^hashtags?\s*:/i, "")
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`)),
  };
}

export async function aiRoutes(app: FastifyInstance) {
  app.post("/api/ai/caption", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    const text = b.text || "my new post";
    const tone = b.tone || "Casual";
    const platform = b.platform || "tiktok";
    const voice = await brandVoiceOf(s.user.id, b.brand_id);

    if (groqConfigured()) {
      try {
        const r = await groqChat(
          `You write social-media captions. Brand voice: ${voice}. Tone: ${tone}. Platform: ${platform}. Reply in exactly this format:\nCAPTION: <one caption, no quotes>\nHASHTAGS: <comma-separated hashtags>`,
          text
        );
        const parsed = parseCaption(r.text);
        await record(s.user.id, "caption", JSON.stringify(b), r.text, r.inTokens, r.outTokens, r.model);
        return { ...parsed, model: r.model };
      } catch (e) {
        return reply.status(502).send({ error: e instanceof Error ? e.message : "AI request failed" });
      }
    }

    const caption = `${text} — told in a ${tone.toLowerCase()} voice${voice !== tone ? ` with your ${voice.toLowerCase()} brand touch` : ""}, tuned for ${platform}.`;
    const hashtags = ["#NewPost", "#Creator", "#OneLink"];
    await record(s.user.id, "caption", JSON.stringify(b), caption);
    return { caption, hashtags, model: "template" };
  });

  app.post("/api/ai/hooks", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    const topic = b.topic || "starting a business";

    if (groqConfigured()) {
      try {
        const r = await groqChat(
          "Write 5 short, punchy video hooks. One per line, no numbering, no quotes.",
          `Topic: ${topic}`
        );
        const hooks = r.text.split("\n").map((l) => l.replace(/^\d+[.)]\s*/, "").trim()).filter(Boolean);
        await record(s.user.id, "hooks", topic, r.text, r.inTokens, r.outTokens, r.model);
        return { hooks, model: r.model };
      } catch (e) {
        return reply.status(502).send({ error: e instanceof Error ? e.message : "AI request failed" });
      }
    }

    const hooks = HOOKS.map((f) => f(topic));
    await record(s.user.id, "hooks", topic, hooks.join("\n"));
    return { hooks, model: "template" };
  });

  app.post("/api/ai/ideas", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    const niche = b.niche || "your niche";

    if (groqConfigured()) {
      try {
        const r = await groqChat(
          "Suggest 5 concrete social-media content ideas. One per line, no numbering, no quotes.",
          `Niche: ${niche}`
        );
        const ideas = r.text.split("\n").map((l) => l.replace(/^\d+[.)]\s*/, "").trim()).filter(Boolean);
        await record(s.user.id, "ideas", niche, r.text, r.inTokens, r.outTokens, r.model);
        return { ideas, model: r.model };
      } catch (e) {
        return reply.status(502).send({ error: e instanceof Error ? e.message : "AI request failed" });
      }
    }

    const ideas = IDEAS.map((i) => `${i} (Angle: ${niche}.)`);
    await record(s.user.id, "ideas", niche, ideas.join("\n"));
    return { ideas, model: "template" };
  });

  app.post("/api/ai/ask", async (req, reply) => {
    const s = await requireUser(req, reply);
    if (!s) return;
    const b = (req.body ?? {}) as Record<string, string>;
    const question = b.question || "";

    if (groqConfigured()) {
      try {
        const r = await groqChat(
          "You are One Link, a practical social-media consultant for creators and small businesses. Answer briefly and concretely, in plain language.",
          question,
          350
        );
        await record(s.user.id, "ask", question, r.text, r.inTokens, r.outTokens, r.model);
        return { answer: r.text, model: r.model };
      } catch (e) {
        return reply.status(502).send({ error: e instanceof Error ? e.message : "AI request failed" });
      }
    }

    const q = question.toLowerCase();
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
    await record(s.user.id, "ask", question, answer);
    return { answer, model: "template" };
  });
}
