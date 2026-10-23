import { useEffect, useState } from "react";
import { platformLabel } from "@one-link/shared";
import { api, errorText } from "../lib/api";
import type { Section } from "../lib/sections";
import { Empty, PageHead, PlatformDot } from "../components/ui";

interface Summary {
  by_platform: { platform: string; views: number; engagement: number }[];
  totals: { views: number; reach: number; likes: number; comments: number; shares: number; saves: number };
  coach: string;
}

export default function Analytics({ go }: { go: (s: Section) => void }) {
  const [data, setData] = useState<Summary | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api.get("/api/analytics/summary").then(setData).catch((e) => setErr(errorText(e))); }, []);

  if (!data) {
    return (
      <>
        <PageHead title="Analytics" sub="How your posts are doing across networks." />
        {err ? <p className="notice notice-bad">{err}</p> : <Empty title="No numbers yet">Post something first. Results show here once networks report them.</Empty>}
        <div className="row"><button className="btn btn-dark" onClick={() => go("Create")}>Write a post</button></div>
      </>
    );
  }
  const t = data.totals;
  const max = Math.max(1, ...data.by_platform.map((p) => p.views));
  return (
    <>
      <PageHead title="Analytics" sub="Totals across your networks." />
      <div className="grid">
        <div className="card"><span className="stat-label">Views</span><p className="stat">{t.views.toLocaleString()}</p></div>
        <div className="card"><span className="stat-label">Reach</span><p className="stat">{t.reach.toLocaleString()}</p></div>
        <div className="card"><span className="stat-label">Interactions</span><p className="stat">{(t.likes + t.comments + t.shares + t.saves).toLocaleString()}</p><p className="muted small">Likes, comments, shares and saves</p></div>
      </div>
      <div className="split">
        <div className="card">
          <h3>Views by network</h3>
          {data.by_platform.map((p) => (
            <div key={p.platform} style={{ margin: "10px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span><PlatformDot platform={p.platform} />{platformLabel(p.platform)}</span><span className="mono">{p.views.toLocaleString()}</span></div>
              <div className="meter"><i style={{ width: `${(p.views / max) * 100}%`, background: "var(--orange)" }} /></div>
            </div>
          ))}
        </div>
        <div className="card"><h3>Your coach says</h3><p>{data.coach}</p></div>
      </div>
    </>
  );
}
