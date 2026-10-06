import type { FastifyInstance } from "fastify";

interface Trend {
  topic: string;
  category: string;
  platform: string;
  heat: "rising" | "hot" | "steady";
  hashtags: string[];
}

const SEED: Trend[] = [
  { topic: "New drop teasers", category: "Fashion", platform: "tiktok", heat: "hot", hashtags: ["#NewDrop", "#Fashion", "#Style"] },
  { topic: "Behind the scenes", category: "Business", platform: "instagram", heat: "rising", hashtags: ["#BTS", "#SmallBusiness", "#Process"] },
  { topic: "Price reveals", category: "Business", platform: "facebook", heat: "steady", hashtags: ["#ShopLocal", "#Deals"] },
  { topic: "Hook-first storytelling", category: "Education", platform: "tiktok", heat: "rising", hashtags: ["#LearnOnTikTok", "#StoryTime"] },
  { topic: "Customer transformations", category: "Beauty", platform: "instagram", heat: "hot", hashtags: ["#BeforeAfter", "#GlowUp"] },
  { topic: "Founder diaries", category: "Business", platform: "linkedin", heat: "steady", hashtags: ["#Founder", "#Startup"] },
  { topic: "Juba street style", category: "Fashion", platform: "tiktok", heat: "rising", hashtags: ["#JubaFashion", "#AfricanFashion", "#Style"] },
  { topic: "Weekend food spots", category: "Food", platform: "facebook", heat: "steady", hashtags: ["#Foodie", "#LocalEats"] },
];

export async function trendRoutes(app: FastifyInstance) {
  app.get("/api/trends", async (req) => {
    const q = req.query as Record<string, string | undefined>;
    return SEED.filter(
      (t) =>
        (!q.platform || q.platform === "all" || t.platform === q.platform) &&
        (!q.category || q.category === "all" || t.category === q.category)
    );
  });
}
