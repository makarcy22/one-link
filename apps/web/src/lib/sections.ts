export const SECTIONS = [
  "Home",
  "Create",
  "Trends",
  "Inspire",
  "Planner",
  "Analytics",
  "Assistant",
  "Profile",
] as const;

export type Section = (typeof SECTIONS)[number];
