import { useEffect, useState } from "react";
import { api, errorText } from "../lib/api";
import { PlatformDot, useToast } from "./ui";

interface Page { page_id: string; page_name: string; can_post: boolean; selected: boolean }

/** Shown after Facebook is connected: pick the Page One Link posts to. */
export default function FacebookPages({ connected, reloadKey }: { connected: boolean; reloadKey: number }) {
  const toast = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const load = () => api.get("/api/social/facebook/pages").then(setPages).catch(() => setPages([]));
  useEffect(() => { if (connected) load(); else setPages([]); }, [connected, reloadKey]);

  if (!connected) {
    return (
      <div className="card">
        <h3><PlatformDot platform="facebook" />Facebook Page</h3>
        <p className="muted">Connect Facebook above and choose the Page One Link should post to. This is the first network that posts for you automatically.</p>
      </div>
    );
  }
  const chosen = pages.find((p) => p.selected);
  return (
    <div className="card">
      <h3><PlatformDot platform="facebook" />Facebook Page to post to</h3>
      {pages.length === 0 && <p className="notice notice-warn">No Pages found. You need a Facebook Page where you can create posts. Reconnect Facebook and allow Page access.</p>}
      {pages.length > 0 && !chosen && <p className="notice notice-warn">Choose a Page. Scheduled Facebook posts wait for this.</p>}
      <div className="list">
        {pages.map((p) => (
          <div key={p.page_id} className="list-item">
            <div className="grow"><div className="title">{p.page_name}</div>{!p.can_post && <div className="muted small">Your role on this Page cannot create posts.</div>}</div>
            {p.selected ? <span className="pill pill-good">Posting here</span> : (
              <button className="btn btn-sm" disabled={!p.can_post} onClick={async () => {
                try { await api.post("/api/social/facebook/pages/select", { page_id: p.page_id }); toast(`Posting to ${p.page_name}.`); load(); }
                catch (e) { toast(errorText(e), "bad"); }
              }}>Use this Page</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
