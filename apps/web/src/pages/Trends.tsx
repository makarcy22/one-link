import { useEffect, useState } from "react";
import type { Trend, CalendarEvent } from "@one-link/shared";
import { platformLabel } from "@one-link/shared";
import { api, errorText } from "../lib/api";
import { setHandoff, type Section } from "../lib/sections";
import { PageHead, PlatformDot } from "../components/ui";

interface Resp { as_of: string; note: string; regions: { key: string; label: string }[]; categories: string[]; items: Trend[]; events: CalendarEvent[] }
const PLATFORMS = ["all", "facebook", "instagram", "tiktok", "linkedin", "x", "whatsapp"];
const MOMENTUM: Record<string, string> = { rising: "Rising", steady: "Steady", seasonal: "Seasonal" };

export default function Trends({ go }: { go: (s: Section) => void }) {
  const [platform, setPlatform] = useState("all");
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("");
  const [q, setQ] = useState("");
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams({ platform, category, ...(region ? { region } : {}), ...(q ? { q } : {}) });
      api.get(`/api/trends?${qs}`).then((d) => { setData(d); setErr(""); }).catch((e) => setErr(errorText(e)));
    }, 200);
    return () => clearTimeout(t);
  }, [platform, category, region, q]);

  return (
    <>
      <PageHead title="Trends" sub="Ideas and formats that work, picked for your topic and region. Each one comes with a hook and hashtags you can use today." />
      {data && <p className="notice notice-info">{data.note} Last reviewed {data.as_of}.</p>}
      {err && <p className="notice notice-bad">{err}</p>}

      <div className="card flat">
        <div className="row" style={{ marginTop: 0 }}>
          <label className="field" htmlFor="tr-q" style={{ flex: "1 1 200px" }}>Search<input id="tr-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Street food, launch, tutorial…" /></label>
          <label className="field" htmlFor="tr-cat" style={{ flex: "1 1 150px" }}>Topic
            <select id="tr-cat" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All topics</option>{data?.categories.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="field" htmlFor="tr-reg" style={{ flex: "1 1 150px" }}>Region
            <select id="tr-reg" value={region} onChange={(e) => setRegion(e.target.value)}><option value="">My region</option>{data?.regions.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}</select></label>
        </div>
        <div className="row">{PLATFORMS.map((p) => <button key={p} className={`chip${platform === p ? " on" : ""}`} aria-pressed={platform === p} onClick={() => setPlatform(p)} >{p === "all" ? "All networks" : platformLabel(p)}</button>)}</div>
      </div>

      {data && data.events.length > 0 && (
        <div className="card">
          <h3>Dates coming up</h3>
          <div className="row" style={{ marginTop: 4 }}>
            {data.events.slice(0, 5).map((e) => (
              <button key={e.date + e.name} className="chip" onClick={() => { setHandoff({ text: e.ideas[0] ?? e.name }); go("Create"); }}>
                {new Date(e.date).toLocaleDateString([], { day: "numeric", month: "short" })} · {e.name}{e.approx ? " (date may vary)" : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid">
        {data?.items.map((t) => (
          <article key={t.id} className="card" style={{ display: "grid", gap: 8, alignContent: "start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <span className="stat-label">{t.category}</span>
              <span className={`pill ${t.momentum === "rising" ? "pill-good" : t.momentum === "seasonal" ? "pill-warn" : "pill-info"}`}>{MOMENTUM[t.momentum]}</span>
            </div>
            <h3 style={{ margin: 0 }}>{t.topic}</h3>
            <p className="muted" style={{ margin: 0 }}>{t.why}</p>
            <p style={{ margin: 0 }}><b>Make:</b> {t.format}</p>
            <p className="preview-post" style={{ margin: 0 }}>“{t.hook}”</p>
            <div>{t.hashtags.map((h) => <span key={h} className="chip">{h}</span>)}</div>
            <div className="muted small" style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{t.platforms.map((p) => <span key={p} style={{ display: "inline-flex", alignItems: "center" }}><PlatformDot platform={p} />{platformLabel(p)}</span>)}</div>
            <div className="row" style={{ margin: 0 }}><button className="btn btn-sm btn-dark" onClick={() => { setHandoff({ text: t.hook, tags: t.hashtags.join(" ") }); go("Create"); }}>Make a post</button></div>
          </article>
        ))}
      </div>
      {data && data.items.length === 0 && <div className="empty"><strong>No trends match</strong><p className="muted">Clear a filter or search for something broader.</p></div>}
    </>
  );
}
