const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
async function req(path, init) {
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
    get: (path) => req(path),
    post: (path, body) => req(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
    put: (path, body) => req(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
    del: (path) => req(path, { method: "DELETE" }),
};
//# sourceMappingURL=api.js.map