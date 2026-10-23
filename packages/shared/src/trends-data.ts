import type { PlatformKey } from "./platforms.js";

// Curated starter trends. These are EDITORIAL content formats and calendar moments,
// not live platform data. The API labels them "curated" so the app never claims otherwise.
// A live trend source can be added later behind the same shape.

export const TRENDS_AS_OF = "2026-10";

export type Region = "global" | "east_africa" | "south_sudan" | "west_africa" | "southern_africa";
export type Momentum = "rising" | "steady" | "seasonal";

export const REGIONS: { key: Region; label: string }[] = [
  { key: "global", label: "Global" },
  { key: "east_africa", label: "East Africa" },
  { key: "south_sudan", label: "South Sudan" },
  { key: "west_africa", label: "West Africa" },
  { key: "southern_africa", label: "Southern Africa" },
];

export const CATEGORIES = [
  "Fashion", "Beauty", "Food", "Business", "Education", "Technology",
  "Music", "Comedy", "Sports", "Lifestyle", "News", "Entertainment",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Trend {
  id: string;
  topic: string;
  category: Category;
  platforms: PlatformKey[];
  regions: Region[];
  momentum: Momentum;
  hashtags: string[];
  /** Why this works, in plain language. */
  why: string;
  /** The content format to make. */
  format: string;
  /** An opening line to start from. */
  hook: string;
}

export const TRENDS: Trend[] = [
  { id: "drop-teaser", topic: "New drop teasers", category: "Fashion", platforms: ["tiktok", "instagram", "facebook"], regions: ["global"], momentum: "steady",
    hashtags: ["#NewDrop", "#Fashion", "#Style", "#OOTD"], why: "A short teaser builds anticipation and gives followers a reason to come back on launch day.",
    format: "3 short clips: detail shot, reveal, date card", hook: "Something new lands Friday. Here is a first look." },
  { id: "street-style-juba", topic: "Juba street style", category: "Fashion", platforms: ["tiktok", "instagram", "facebook"], regions: ["south_sudan", "east_africa"], momentum: "rising",
    hashtags: ["#JubaFashion", "#AfricanFashion", "#StreetStyle", "#Style"], why: "Local style content gets shared by people who recognize the place, which reaches the right audience.",
    format: "Walk-and-talk outfit video, 15 to 30 seconds", hook: "This is what Juba is wearing this week." },
  { id: "kitenge-looks", topic: "Kitenge and Ankara styling", category: "Fashion", platforms: ["tiktok", "instagram", "facebook"], regions: ["east_africa", "west_africa", "south_sudan"], momentum: "steady",
    hashtags: ["#Kitenge", "#Ankara", "#AfricanPrint", "#AfricanFashion"], why: "Print styling videos are easy to save and reuse as outfit ideas.",
    format: "One fabric, three outfits", hook: "One fabric. Three ways to wear it." },
  { id: "bts-studio", topic: "Behind the scenes", category: "Business", platforms: ["instagram", "facebook", "tiktok"], regions: ["global"], momentum: "rising",
    hashtags: ["#BehindTheScenes", "#SmallBusiness", "#MadeLocal", "#Process"], why: "Showing how something is made builds trust and justifies your price.",
    format: "Time-lapse of one product from start to finish", hook: "How this is actually made." },
  { id: "price-reveal", topic: "Price reveals and what you get", category: "Business", platforms: ["facebook", "instagram"], regions: ["global"], momentum: "steady",
    hashtags: ["#ShopLocal", "#Deals", "#SmallBusiness"], why: "Clear prices answer the most common question in your inbox before people ask it.",
    format: "Carousel or short video listing items and prices", hook: "Yes, we answered the price question." },
  { id: "founder-diary", topic: "Founder diaries", category: "Business", platforms: ["linkedin", "facebook"], regions: ["global"], momentum: "steady",
    hashtags: ["#Founder", "#Startup", "#BuildInPublic"], why: "Honest updates from the person behind the business get more replies than polished announcements.",
    format: "Text post with one lesson and one number", hook: "This month I learned something the hard way." },
  { id: "customer-story", topic: "Customer stories and quotes", category: "Business", platforms: ["facebook", "instagram", "linkedin"], regions: ["global"], momentum: "steady",
    hashtags: ["#CustomerLove", "#Testimonial", "#ShopLocal"], why: "People trust other customers more than they trust you.",
    format: "Quote graphic with a first name and a photo", hook: "Our customers said it better than we could." },
  { id: "hook-first", topic: "Hook-first storytelling", category: "Education", platforms: ["tiktok", "instagram", "x"], regions: ["global"], momentum: "rising",
    hashtags: ["#LearnOnTikTok", "#StoryTime", "#Tips"], why: "The first two seconds decide whether anyone stays. Lead with the surprising part.",
    format: "Video that opens on the result, then explains", hook: "Nobody tells you this before starting a business." },
  { id: "myth-vs-fact", topic: "Myth versus fact", category: "Education", platforms: ["tiktok", "instagram", "linkedin", "x"], regions: ["global"], momentum: "steady",
    hashtags: ["#MythVsFact", "#Learn", "#Tips"], why: "Correcting a common mistake is useful and easy to share.",
    format: "Two-card carousel or 20-second video", hook: "Stop believing this about your business." },
  { id: "how-to-micro", topic: "60-second how-tos", category: "Education", platforms: ["tiktok", "instagram", "facebook"], regions: ["global"], momentum: "rising",
    hashtags: ["#HowTo", "#Tutorial", "#LearnSomethingNew"], why: "Short, specific lessons get saved and rewatched.",
    format: "Screen or hands-on demo with on-screen steps", hook: "Do this in under a minute." },
  { id: "glow-up", topic: "Customer transformations", category: "Beauty", platforms: ["instagram", "tiktok", "facebook"], regions: ["global"], momentum: "steady",
    hashtags: ["#BeforeAfter", "#GlowUp", "#Beauty"], why: "Before and after is a format everyone understands in a second.",
    format: "Split-screen or swipe reveal", hook: "Watch this one change." },
  { id: "braids-hair", topic: "Braids and hair care routines", category: "Beauty", platforms: ["tiktok", "instagram", "facebook"], regions: ["east_africa", "west_africa", "south_sudan", "southern_africa"], momentum: "steady",
    hashtags: ["#Braids", "#NaturalHair", "#HairCare", "#AfricanBeauty"], why: "Routine content is saved and shared by people planning their next style.",
    format: "Time-lapse of a full style with the price on screen", hook: "Six hours in 20 seconds." },
  { id: "local-food", topic: "Local food spots and recipes", category: "Food", platforms: ["facebook", "instagram", "tiktok"], regions: ["global"], momentum: "steady",
    hashtags: ["#Foodie", "#LocalEats", "#StreetFood"], why: "Food content travels well in local groups and invites comments like 'where is this?'",
    format: "One dish, three shots, price and location", hook: "The best plate in town costs less than you think." },
  { id: "mobile-money-tips", topic: "Mobile money and cashless tips", category: "Business", platforms: ["facebook", "tiktok", "linkedin"], regions: ["east_africa", "west_africa"], momentum: "rising",
    hashtags: ["#MobileMoney", "#SmallBusiness", "#FinTech"], why: "Many small businesses sell through mobile money. Practical tips get saved.",
    format: "Short explainer with one clear step", hook: "Get paid faster with one setting." },
  { id: "ai-tools", topic: "Simple AI tools for small business", category: "Technology", platforms: ["linkedin", "x", "tiktok"], regions: ["global"], momentum: "rising",
    hashtags: ["#AITools", "#Productivity", "#SmallBusiness"], why: "Specific, tested workflows beat general AI talk.",
    format: "Screen recording of one task done in a minute", hook: "I saved two hours a week with this." },
  { id: "phone-photo-tips", topic: "Phone photography for product shots", category: "Technology", platforms: ["instagram", "tiktok", "facebook"], regions: ["global"], momentum: "steady",
    hashtags: ["#PhonePhotography", "#ProductPhotography", "#Tips"], why: "People selling online want better photos without buying a camera.",
    format: "Before and after of the same product", hook: "Same phone. Better photo." },
  { id: "music-cover", topic: "Cover and remix clips", category: "Music", platforms: ["tiktok", "instagram", "facebook"], regions: ["global"], momentum: "steady",
    hashtags: ["#Cover", "#NewMusic", "#MusicLovers"], why: "Short performances give listeners a taste and a reason to follow.",
    format: "30-second performance with lyrics on screen", hook: "I could not stop replaying this." },
  { id: "east-africa-music", topic: "Afro-fusion dance challenges", category: "Music", platforms: ["tiktok", "instagram"], regions: ["east_africa", "west_africa", "south_sudan"], momentum: "rising",
    hashtags: ["#AfroBeats", "#DanceChallenge", "#AfricanMusic"], why: "Dance clips are easy to copy, which spreads them.",
    format: "Simple 8-count routine filmed in one take", hook: "Learn this in 30 seconds." },
  { id: "relatable-skit", topic: "Relatable everyday skits", category: "Comedy", platforms: ["tiktok", "instagram", "facebook"], regions: ["global"], momentum: "steady",
    hashtags: ["#Relatable", "#Skit", "#Comedy"], why: "People share what feels like their own life.",
    format: "One scene, one joke, under 30 seconds", hook: "POV: it is the end of the month." },
  { id: "match-day", topic: "Match day reactions", category: "Sports", platforms: ["x", "facebook", "tiktok"], regions: ["global"], momentum: "seasonal",
    hashtags: ["#MatchDay", "#Football", "#AFCON"], why: "Reactions during live events reach people who are already searching.",
    format: "Short reaction video posted within minutes", hook: "I cannot believe that just happened." },
  { id: "morning-routine", topic: "Realistic routines", category: "Lifestyle", platforms: ["instagram", "tiktok", "facebook"], regions: ["global"], momentum: "steady",
    hashtags: ["#DayInMyLife", "#Routine", "#Lifestyle"], why: "Routine content feels personal and invites people to compare.",
    format: "Day in my life with three time stamps", hook: "A real Tuesday. No filter." },
  { id: "explainer-news", topic: "News explained in 30 seconds", category: "News", platforms: ["x", "facebook", "tiktok"], regions: ["global"], momentum: "steady",
    hashtags: ["#Explained", "#News", "#WhatYouNeedToKnow"], why: "People want the point without the noise. Cite your source.",
    format: "Headline, three facts, one source", hook: "Here is what actually changed." },
  { id: "behind-the-mic", topic: "Podcast and interview clips", category: "Entertainment", platforms: ["tiktok", "instagram", "linkedin", "x"], regions: ["global"], momentum: "steady",
    hashtags: ["#Podcast", "#Interview", "#Clips"], why: "A strong 30-second clip is the best advertisement for the full episode.",
    format: "Captioned clip with a bold first line", hook: "The part nobody expected." },
  { id: "learn-local-language", topic: "Local language phrase of the day", category: "Education", platforms: ["tiktok", "instagram", "facebook"], regions: ["east_africa", "south_sudan", "west_africa"], momentum: "rising",
    hashtags: ["#LearnArabic", "#LearnSwahili", "#LanguageLearning", "#Culture"], why: "Language lessons are saved and shared with friends and family abroad.",
    format: "One phrase, pronunciation, example sentence", hook: "Say this and people will smile." },
];

export const CATEGORY_TAGS: Record<string, string[]> = {
  Fashion: ["#Fashion", "#Style", "#OOTD", "#AfricanFashion"],
  Beauty: ["#Beauty", "#Skincare", "#GlowUp"],
  Food: ["#Foodie", "#LocalEats", "#Recipe"],
  Business: ["#SmallBusiness", "#Entrepreneur", "#ShopLocal"],
  Education: ["#Learn", "#Tips", "#HowTo"],
  Technology: ["#Tech", "#Productivity", "#Innovation"],
  Music: ["#NewMusic", "#MusicLovers", "#Artist"],
  Comedy: ["#Comedy", "#Relatable", "#Funny"],
  Sports: ["#Sports", "#Football", "#Fitness"],
  Lifestyle: ["#Lifestyle", "#DayInMyLife", "#Routine"],
  News: ["#News", "#Explained"],
  Entertainment: ["#Entertainment", "#Podcast"],
};

export interface TrendQuery {
  platform?: string;
  category?: string;
  region?: string;
  q?: string;
}

function included(value: string | undefined): string | null {
  const v = (value ?? "").trim().toLowerCase();
  return v && v !== "all" ? v : null;
}

/** Filters curated trends. A region filter keeps trends for that region plus global ones. */
export function filterTrends(query: TrendQuery = {}, trends: Trend[] = TRENDS): Trend[] {
  const platform = included(query.platform);
  const category = included(query.category);
  const region = included(query.region);
  const q = (query.q ?? "").trim().toLowerCase();
  return trends.filter((t) => {
    if (platform && !t.platforms.includes(platform as PlatformKey)) return false;
    if (category && t.category.toLowerCase() !== category) return false;
    if (region && region !== "global" && !t.regions.includes(region as Region) && !t.regions.includes("global")) return false;
    if (q) {
      const hay = `${t.topic} ${t.category} ${t.format} ${t.hashtags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

const MOMENTUM_ORDER: Record<Momentum, number> = { rising: 0, seasonal: 1, steady: 2 };

/** Orders trends so the user's niche and region come first, then rising ones. */
export function rankTrends(trends: Trend[], opts: { niche?: string; categories?: string[]; region?: string } = {}): Trend[] {
  const niche = (opts.niche ?? "").trim().toLowerCase();
  const cats = (opts.categories ?? []).map((c) => c.toLowerCase());
  const region = (opts.region ?? "").trim().toLowerCase();
  const score = (t: Trend) => {
    let s = 0;
    if (cats.includes(t.category.toLowerCase())) s += 3;
    if (niche && `${t.topic} ${t.category} ${t.hashtags.join(" ")}`.toLowerCase().includes(niche)) s += 3;
    if (region && region !== "global" && t.regions.includes(region as Region)) s += 2;
    return s;
  };
  return [...trends].sort((a, b) => score(b) - score(a) || MOMENTUM_ORDER[a.momentum] - MOMENTUM_ORDER[b.momentum] || a.topic.localeCompare(b.topic));
}

export interface CalendarEvent {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  name: string;
  regions: Region[];
  /** True when the date depends on moon sighting or changes year to year. Confirm before relying on it. */
  approx?: boolean;
  ideas: string[];
}

export const EVENTS: CalendarEvent[] = [
  { date: "2026-10-09", name: "Uganda Independence Day", regions: ["east_africa"], ideas: ["Share a story about your Uganda customers.", "Post a local-pride graphic."] },
  { date: "2026-10-20", name: "Mashujaa Day (Kenya)", regions: ["east_africa"], ideas: ["Honor a local hero from your community.", "Share a holiday-hours notice."] },
  { date: "2026-11-27", name: "Black Friday", regions: ["global"], ideas: ["Tease your offer a week early.", "Show what is included, with prices.", "Countdown post on the last day."] },
  { date: "2026-11-30", name: "Cyber Monday", regions: ["global"], ideas: ["Last-chance reminder for online offers."] },
  { date: "2026-12-09", name: "Tanzania Independence Day", regions: ["east_africa"], ideas: ["Share a thank-you to Tanzanian customers."] },
  { date: "2026-12-12", name: "Jamhuri Day (Kenya)", regions: ["east_africa"], ideas: ["Holiday greeting with your opening hours."] },
  { date: "2026-12-25", name: "Christmas", regions: ["global"], ideas: ["Gift guide post.", "Thank-you message to customers.", "Holiday opening hours."] },
  { date: "2026-12-31", name: "New Year's Eve", regions: ["global"], ideas: ["Year in review: three wins.", "Teaser for what is coming next year."] },
  { date: "2027-01-01", name: "New Year", regions: ["global"], ideas: ["Goals for the year.", "New collection or service announcement."] },
  { date: "2027-01-09", name: "Peace Agreement Day (South Sudan)", regions: ["south_sudan"], ideas: ["Message of unity with your community."] },
  { date: "2027-02-08", name: "Ramadan begins (approx.)", regions: ["global", "east_africa", "west_africa"], approx: true, ideas: ["Ramadan greeting.", "Special hours or offers.", "Iftar-friendly content."] },
  { date: "2027-02-14", name: "Valentine's Day", regions: ["global"], ideas: ["Gift ideas under a set budget.", "Couples or friends offer."] },
  { date: "2027-03-08", name: "International Women's Day", regions: ["global"], ideas: ["Feature a woman in your team or customers.", "Share a story of a woman-led business."] },
  { date: "2027-03-09", name: "Eid al-Fitr (approx.)", regions: ["global", "east_africa", "west_africa"], approx: true, ideas: ["Eid greeting.", "Eid outfit or gift ideas."] },
  { date: "2027-03-26", name: "Good Friday", regions: ["global"], ideas: ["Holiday hours notice."] },
  { date: "2027-03-28", name: "Easter Sunday", regions: ["global"], ideas: ["Easter greeting.", "Family gathering ideas."] },
  { date: "2027-05-16", name: "SPLA Day (South Sudan)", regions: ["south_sudan"], ideas: ["Holiday hours notice."] },
  { date: "2027-05-25", name: "Africa Day", regions: ["global", "east_africa", "west_africa", "south_sudan", "southern_africa"], ideas: ["Celebrate African-made products.", "Share what Africa means to your brand."] },
  { date: "2027-06-01", name: "Madaraka Day (Kenya)", regions: ["east_africa"], ideas: ["Holiday greeting."] },
  { date: "2027-07-09", name: "South Sudan Independence Day", regions: ["south_sudan"], ideas: ["Celebrate with a community story.", "Post a heritage-inspired design or offer."] },
];

/** Events happening within the next `days` days, soonest first. Optionally limited to a region plus global. */
export function upcomingEvents(now: Date, days = 60, region?: string): CalendarEvent[] {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const end = start + days * 86_400_000;
  const r = included(region);
  return EVENTS.filter((e) => {
    const t = Date.parse(`${e.date}T00:00:00Z`);
    if (t < start || t > end) return false;
    if (r && r !== "global" && !e.regions.includes(r as Region) && !e.regions.includes("global")) return false;
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date));
}
