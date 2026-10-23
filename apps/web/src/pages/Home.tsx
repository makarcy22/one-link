import { useEffect, useState } from "react";
import { platformLabel } from "@one-link/shared";
import { api } from "../lib/api";
import { whenText } from "../lib/format";
import { setHandoff, type Section } from "../lib/sections";
import { Empty, Icon, PageHead, PlatformDot, StatusPill } from "../components/ui";
import { useSession } from "../auth/auth-client";

interface Overview {
  next_posts: { id: string; platforms: string; scheduled_at: string; caption: string | null }[];
  needs_attention: { id: string; schedule_id: string; platform: string; status: string; last_error: string }[];
  counts: { scheduled: number; published: number; drafts: number };
  connected: { platform: string; account_name: string; status: string }[];
  onboarded: boolean;
  niche: string;
  events: { date: string; name: string; ideas: string[] }[];
}

const NETWORKS = ["Facebook", "Instagram", "TikTok", "LinkedIn", "X", "WhatsApp"];
const openAuth = (v: "signin" | "signup") => window.dispatchEvent(new CustomEvent("ol-auth", { detail: v }));

function Landing() {
  return (
    <>
      <section className="landing-hero">
        <div>
          <p className="stat-label" style={{ color: "var(--orange)" }}>One Link</p>
          <h1>Create once.<br /><em>Reach everywhere.</em></h1>
          <p>Write a post one time. One Link fits it to every network, suggests hashtags that match it, and posts it for you or reminds you when it is time.</p>
          <div className="row">
            <button className="btn btn-hero" onClick={() => openAuth("signup")}>Start free</button>
            <button className="btn" style={{ color: "#f4f4f2", borderColor: "#f4f4f2" }} onClick={() => openAuth("signin")}>Sign in</button>
          </div>
        </div>
        <div className="fan" aria-hidden="true">
          <svg viewBox="0 0 300 270" preserveAspectRatio="none">
            {[18, 63, 108, 153, 198, 243].map((y) => <path key={y} d={`M70 135 C 150 135, 170 ${y}, 250 ${y}`} fill="none" stroke="#ff5a1f" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="4 5" />)}
          </svg>
          <div className="src">One post</div>
          {NETWORKS.map((n) => <div key={n} className="dst">{n}</div>)}
        </div>
      </section>
      <section className="how">
        <div className="card"><b>WRITE</b><h3>One draft</h3><p className="muted">Write it, or start from a trend or a template.</p></div>
        <div className="card"><b>REVIEW</b><h3>A version per network</h3><p className="muted">See exactly what each network gets. Edit any version.</p></div>
        <div className="card"><b>PUBLISH</b><h3>We post or we remind you</h3><p className="muted">Facebook Pages post automatically. Others are ready to copy, with a reminder.</p></div>
        <div className="card"><b>LEARN</b><h3>Know what works</h3><p className="muted">Hashtag scores explain why a tag fits your post.</p></div>
      </section>
    </>
  );
}

export default function Home({ go }: { go: (s: Section) => void }) {
  const { data: session, isPending } = useSession();
  const [o, setO] = useState<Overview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!session) return;
    api.get("/api/overview").then(setO).catch(() => setFailed(true));
  }, [session]);

  if (isPending) return <p className="muted">Loading…</p>;
  if (!session) return <Landing />;

  const name = (session.user.name || session.user.email.split("@")[0]).split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const hasFb = o?.connected.some((c) => c.platform === "facebook" && c.status === "connected");

  return (
    <>
      <PageHead title={`${greet}, ${name}`} sub={o?.niche ? `Your space for ${o.niche}.` : "Here is what is happening with your posts."}
        actions={<button className="btn btn-hero" onClick={() => go("Create")}><Icon name="create" size={18} />New post</button>} />
      {failed && <p className="notice notice-bad">Could not load your overview. Check that the server is running, then reload.</p>}
      {o && (
        <>
          <div className="grid">
            <div className="card"><span className="stat-label">Scheduled</span><p className="stat">{o.counts.scheduled}</p></div>
            <div className="card"><span className="stat-label">Posted</span><p className="stat">{o.counts.published}</p></div>
            <div className="card"><span className="stat-label">Drafts</span><p className="stat">{o.counts.drafts}</p></div>
          </div>

          {!hasFb && (
            <div className="card" style={{ borderColor: "var(--orange)" }}>
              <h3>Connect your Facebook Page</h3>
              <p className="muted">Facebook is the first network One Link posts to for you. Connect it once and scheduled posts go out on their own.</p>
              <div className="row"><button className="btn btn-dark" onClick={() => go("Profile")}>Connect Facebook <Icon name="arrow" size={16} /></button></div>
            </div>
          )}

          {o.needs_attention.length > 0 && (
            <div className="card">
              <h3>Needs your attention</h3>
              <div className="list">
                {o.needs_attention.map((j) => (
                  <div key={j.id} className="list-item">
                    <div className="grow"><div className="title"><PlatformDot platform={j.platform} />{platformLabel(j.platform)}</div><div className="muted small clip">{j.last_error.replace(j.platform, platformLabel(j.platform))}</div></div>
                    <StatusPill status={j.status} />
                    <button className="btn btn-sm" onClick={() => go("Planner")}>Open</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="split">
            <div className="card">
              <h3>Next up</h3>
              {o.next_posts.length === 0 ? (
                <Empty title="Nothing scheduled">Write a post and pick a time. It will show up here.</Empty>
              ) : (
                <div className="list">
                  {o.next_posts.map((p) => (
                    <div key={p.id} className="list-item">
                      <div className="grow">
                        <div className="title clip">{p.caption || "Untitled post"}</div>
                        <div className="muted small"><Icon name="clock" size={14} /> {whenText(p.scheduled_at)} · {(JSON.parse(p.platforms) as string[]).map(platformLabel).join(", ")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="row"><button className="btn btn-sm" onClick={() => go("Planner")}>Open planner</button></div>
            </div>
            <div className="card">
              <h3>Coming up</h3>
              <p className="muted small">Dates worth posting about. Tap one to start.</p>
              <div className="list">
                {o.events.map((e) => (
                  <div key={e.date + e.name} className="list-item">
                    <div className="grow"><div className="title">{e.name}</div><div className="muted small">{new Date(e.date).toLocaleDateString([], { day: "numeric", month: "short" })} · {e.ideas[0]}</div></div>
                    <button className="btn btn-sm" onClick={() => { setHandoff({ text: e.ideas[0] ?? e.name }); go("Create"); }}>Post about it</button>
                  </div>
                ))}
                {o.events.length === 0 && <p className="muted">No dates in the next month.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
