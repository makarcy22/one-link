export const SECTIONS = ["Home", "Create", "Trends", "Inspire", "Planner", "Analytics", "Assistant", "Profile"] as const;
export type Section = (typeof SECTIONS)[number];
export const SECTION_ICON = {
  Home: "home", Create: "create", Trends: "trends", Inspire: "inspire",
  Planner: "planner", Analytics: "analytics", Assistant: "assistant", Profile: "profile",
} as const;
/** Pages can pass a small hint to the next page (for example, text to start a post with). */
let handoff: Record<string, string> = {};
export function setHandoff(h: Record<string, string>) { handoff = h; }
export function takeHandoff(): Record<string, string> { const h = handoff; handoff = {}; return h; }
