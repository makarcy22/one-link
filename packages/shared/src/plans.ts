export type PlanId = "free" | "creator" | "business";

export interface PlanInfo {
  id: PlanId;
  label: string;
  aiMonthly: number;
  blurb: string;
  features: string[];
}

export const PLANS: Record<PlanId, PlanInfo> = {
  free: { id: "free", label: "Free", aiMonthly: 20, blurb: "Try the whole workflow.",
    features: ["20 AI generations a month", "Write, graphics, uploads", "Plan and schedule posts", "Connect your accounts"] },
  creator: { id: "creator", label: "Creator", aiMonthly: 500, blurb: "For creators and personal brands.",
    features: ["500 AI generations a month", "Everything in Free", "Priority for new publishing features"] },
  business: { id: "business", label: "Business", aiMonthly: 2000, blurb: "For businesses and serious creators.",
    features: ["2,000 AI generations a month", "Everything in Creator", "Built for busier publishing"] },
};

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

/**
 * Launch price placeholders in US dollars, inside the ranges in the monetization plan
 * (Creator $12 to $25, Business $39 to $99). The API lets the owner override them with
 * PRICE_CREATOR_USD and PRICE_BUSINESS_USD. Decide the final prices before launch.
 */
export const DEFAULT_PRICES_USD: Record<Exclude<PlanId, "free">, number> = { creator: 15, business: 49 };

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === "string" && (PLAN_IDS as string[]).includes(v);
}
