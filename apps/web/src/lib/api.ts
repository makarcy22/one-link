import { API_BASE } from "./backend";

const BASE = API_BASE;

async function req(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export const api = {
  get: (path: string) => req(path),
  post: (path: string, body: unknown) =>
    req(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: (path: string, body: unknown) =>
    req(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  del: (path: string) => req(path, { method: "DELETE" }),
};
