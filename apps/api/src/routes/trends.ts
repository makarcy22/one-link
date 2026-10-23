import type { FastifyInstance } from "fastify";
import {
  CATEGORIES,
  REGIONS,
  TRENDS,
  TRENDS_AS_OF,
  filterTrends,
  rankTrends,
  upcomingEvents,
} from "@one-link/shared";
import { pool } from "../db.js";
import { auth } from "../auth.js";
import { fromNodeHeaders } from "better-auth/node";

// Trends are a hand-curated guide, not live platform data. The response says so, so the app can too.
export async function trendRoutes(app: FastifyInstance) {
  app.get("/api/trends", async (req) => {
    const q = req.query as Record<string, string | undefined>;
    // Personalise when signed in; a signed-out visitor still gets the full list.
    let niche = q.niche;
    let region = q.region;
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
      if (session && (!niche || !region)) {
        const p = await pool.query("SELECT niche, region FROM user_prefs WHERE user_id=$1", [session.user.id]);
        niche = niche ?? p.rows[0]?.niche;
        region = region ?? p.rows[0]?.region;
      }
    } catch {
      /* no session: fine */
    }
    const items = rankTrends(filterTrends({ platform: q.platform, category: q.category, region, q: q.q }), { niche, region });
    return {
      source: "curated",
      as_of: TRENDS_AS_OF,
      note: "A hand-picked guide to what works, reviewed regularly. It is not live data from the platforms.",
      regions: REGIONS,
      categories: CATEGORIES,
      total: TRENDS.length,
      items,
      events: upcomingEvents(new Date(), 60, region),
    };
  });
}
