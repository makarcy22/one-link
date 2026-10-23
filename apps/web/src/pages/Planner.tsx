import { useCallback, useEffect, useState } from "react";
import { platformLabel } from "@one-link/shared";
import { api, errorText } from "../lib/api";
import { toLocalInput, whenText } from "../lib/format";
import type { Section } from "../lib/sections";
import { Empty, Icon, PageHead, PlatformDot, StatusPill, useToast } from "../components/ui";

interface Job { id: string; platform: string; status: string; last_error: string; external_url: string; dry_run: boolean }
interface Variant { platform: string; caption: string; hashtags: string[]; link: string }
interface Schedule { id: string; platforms: string; scheduled_at: string; status: string; variants: Variant[]; jobs: Job[] }

const finalText = (v: Variant) => [v.caption, v.link, v.hashtags.join(" ")].filter(Boolean).join("\n\n");

export default function Planner({ go }: { go: (s: Section) => void }) {
  const toast = useToast();
  const [items, setItems] = useState<Schedule[] | null>(null);
  const [err, setErr] = useState("");
  const [moving, setMoving] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState("");

  const load = useCallback(async () => {
    try { setItems(await api.get("/api/schedules")); setErr(""); }
    catch (e) { setErr(errorText(e)); setItems([]); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  async function act(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); toast(ok); await load(); } catch (e) { toast(errorText(e), "bad"); }
  }
  async function copy(v: string) {
    try { await navigator.clipboard.writeText(v); toast("Copied. Paste it into the app."); } catch { toast("Copy did not work. Select the text and copy it.", "bad"); }
  }

  const upcoming = (items ?? []).filter((s) => s.status === "scheduled" || s.status === "publishing");
  const past = (items ?? []).filter((s) => !upcoming.includes(s)).reverse();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getTime() + i * 86400000));

  const card = (s: Schedule) => {
    const platforms = JSON.parse(s.platforms) as string[];
    return (
      <article key={s.id} className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div><strong><Icon name="clock" size={16} /> {whenText(s.scheduled_at)}</strong><div className="muted small">{platforms.map(platformLabel).join(", ")}</div></div>
          <StatusPill status={s.status} />
        </div>
        <div className="stack" style={{ marginTop: 10 }}>
          {platforms.map((p) => {
            const v = s.variants.find((x) => x.platform === p);
            const j = s.jobs.find((x) => x.platform === p);
            return (
              <div key={p} className="variant">
                <div className="variant-head">
                  <strong><PlatformDot platform={p} />{platformLabel(p)}</strong>
                  {j && <StatusPill status={j.status} />}
                </div>
                {v && <div className="preview-post clip" style={{ WebkitLineClamp: 3 }}>{v.caption}</div>}
                {j?.dry_run && j.status === "completed" && <p className="notice notice-info">Test run: nothing was sent to {platformLabel(p)}.</p>}
                {j?.status === "completed" && j.external_url && !j.dry_run && <a className="small" href={j.external_url} target="_blank" rel="noreferrer">View the post</a>}
                {j && j.status !== "completed" && j.last_error && <p className={`notice ${j.status === "failed" ? "notice-bad" : "notice-warn"}`}>{j.last_error}</p>}
                <div className="row" style={{ margin: 0 }}>
                  {v && (j?.status === "manual" || j?.status === "failed") && <button className="btn btn-sm" onClick={() => copy(finalText(v))}><Icon name="copy" size={14} />Copy post</button>}
                  {j?.status === "manual" && <button className="btn btn-sm btn-dark" onClick={() => act(() => api.post(`/api/publishing-jobs/${j.id}/mark-posted`, {}), "Marked as posted.")}>I posted it</button>}
                  {j?.status === "failed" && <button className="btn btn-sm btn-hero" onClick={() => act(() => api.post(`/api/publishing-jobs/${j.id}/retry`, {}), "Trying again.")}>Try again</button>}
                </div>
              </div>
            );
          })}
        </div>
        {s.status === "scheduled" && (
          <div className="row">
            <button className="btn btn-sm btn-hero" onClick={() => act(() => api.post(`/api/schedules/${s.id}/publish-now`, {}), "Sending now.")}>Post now</button>
            <button className="btn btn-sm" onClick={() => { setMoving(s.id); setMoveTo(toLocalInput(new Date(s.scheduled_at))); }}>Change time</button>
            <button className="btn btn-sm btn-quiet" onClick={() => act(() => api.del(`/api/schedules/${s.id}`), "Cancelled.")}><Icon name="trash" size={14} />Cancel</button>
          </div>
        )}
        {moving === s.id && (
          <div className="row">
            <input type="datetime-local" aria-label="New time" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} style={{ width: "auto" }} />
            <button className="btn btn-sm btn-dark" onClick={() => act(async () => { await api.put(`/api/schedules/${s.id}`, { scheduled_at: new Date(moveTo).toISOString() }); setMoving(null); }, "Time changed.")}>Save</button>
            <button className="btn btn-sm btn-quiet" onClick={() => setMoving(null)}>Close</button>
          </div>
        )}
      </article>
    );
  };

  return (
    <>
      <PageHead title="Planner" sub="Everything you have lined up, and what needs you." actions={<button className="btn btn-hero" onClick={() => go("Create")}><Icon name="create" size={18} />New post</button>} />
      {err && <p className="notice notice-bad">{err}</p>}
      <div className="card flat">
        <div className="days" aria-label="Next seven days">
          {days.map((d, i) => {
            const todays = upcoming.filter((s) => new Date(s.scheduled_at).toDateString() === d.toDateString());
            return (
              <div key={i} className={`day${i === 0 ? " today" : ""}`}>
                <b>{i === 0 ? "Today" : d.toLocaleDateString([], { weekday: "short", day: "numeric" })}</b>
                {todays.map((s) => <span key={s.id} className="dot">{new Date(s.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>)}
              </div>
            );
          })}
        </div>
      </div>
      {items === null && <p className="muted">Loading…</p>}
      {items && upcoming.length === 0 && <Empty title="Nothing lined up">Write a post in Create and choose a time. It will appear here.</Empty>}
      {upcoming.map(card)}
      {past.length > 0 && <><h2 style={{ marginTop: 24 }}>Earlier</h2>{past.map(card)}</>}
    </>
  );
}
