// Single source of truth for backend + frontend origins.
// Production values come from the build (VITE_API_URL); local dev falls back.
export const API_BASE: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const WEB_ORIGIN: string =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
