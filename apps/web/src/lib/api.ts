export const API_BASE: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
/** Preview mode: a built-in pretend server, so the whole app can be tried without any setup. */
export const MOCK: boolean = import.meta.env.VITE_MOCK_API === "true";
const BASE = API_BASE;

export const SLEEPING_MESSAGE = "The server is waking up after a quiet period. This can take up to a minute. Please wait a little and try again.";

/** Ask the server to wake up in the background (free hosting puts it to sleep when it is idle). */
let warmed = false;
export function wakeServer() {
  if (MOCK || warmed) return;
  warmed = true;
  fetch(`${BASE}/api/auth/ok`, { method: "GET", mode: "cors" }).catch(() => { warmed = false; });
}

async function req(path: string, init?: RequestInit) {
  if (MOCK) {
    const { mockRequest } = await import("../dev/mockApi");
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    return mockRequest(path, init?.method ?? "GET", body);
  }
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  // A web page (not data) means the server is still starting up, or the address is wrong.
  if ((res.headers.get("content-type") ?? "").includes("text/html")) throw new Error(SLEEPING_MESSAGE);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text || res.statusText;
    try {
      const j = JSON.parse(text) as { error?: string };
      if (j.error) message = j.error;
    } catch {
      /* not JSON */
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  get: (path: string) => req(path),
  post: (path: string, body: unknown) => req(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: (path: string, body: unknown) => req(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  del: (path: string) => req(path, { method: "DELETE" }),
  async upload(file: File) {
    if (MOCK) {
      const { mockUpload } = await import("../dev/mockApi");
      return mockUpload(file);
    }
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/api/media/upload`, { method: "POST", body: form, credentials: "include" });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      let m = t;
      try { m = (JSON.parse(t) as { error?: string }).error ?? t; } catch { /* plain */ }
      throw new Error(m || "Upload failed");
    }
    return res.json();
  },
};

/** The message from a failed call, ready to show to a person. */
export function errorText(e: unknown, fallback = "Something went wrong. Try again."): string {
  const m = e instanceof Error ? e.message : "";
  if (/<!doctype|unexpected token/i.test(m)) return SLEEPING_MESSAGE;
  if (!m || /failed to fetch|networkerror|load failed/i.test(m)) return "Could not reach One Link. Check your connection and that the server is running.";
  return m || fallback;
}
