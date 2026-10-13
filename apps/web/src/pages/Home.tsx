import { useEffect, useState } from "react";
import { signIn, signUp, useSession } from "../auth/auth-client";
import { api } from "../lib/api";
import type { Section } from "../lib/sections";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Trailer({ replayKey, onReplay }: { replayKey: number; onReplay: () => void }) {
  return (
    <div className="card trailer-card">
      <h3>Why One Link?</h3>
      <div className="toon-stage" key={replayKey}>
        <div className="scene scene-travel">
          <svg className="route-svg" viewBox="0 0 600 120" preserveAspectRatio="none">
            <path
              d="M30 92 Q 160 30 300 72 T 570 48"
              fill="none"
              stroke="#c7d2fe"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="12 10"
              className="route-line"
            />
          </svg>
          <div className="toon-nodes">
            <span className="node n1">TikTok</span>
            <span className="node n2">Reel</span>
            <span className="node n3">Facebook</span>
            <span className="node n4">LinkedIn</span>
          </div>
          <svg className="toon traveler3d" viewBox="0 0 100 122">
            <defs>
              <radialGradient id="skin3d" cx="35%" cy="28%" r="85%">
                <stop offset="0%" stopColor="#ffedd2" />
                <stop offset="55%" stopColor="#ffcf9e" />
                <stop offset="100%" stopColor="#dd9257" />
              </radialGradient>
              <linearGradient id="shirt3d" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="55%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#312e81" />
              </linearGradient>
              <linearGradient id="sweat3d" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            <ellipse className="toon-shadow" cx="50" cy="115" rx="26" ry="6" fill="rgba(0,0,0,0.28)" />
            <g className="toon-bob">
              <line x1="42" y1="88" x2="40" y2="110" stroke="#1f2937" strokeWidth="7" strokeLinecap="round" />
              <line x1="58" y1="88" x2="60" y2="110" stroke="#1f2937" strokeWidth="7" strokeLinecap="round" />
              <rect x="34" y="54" width="32" height="38" rx="13" fill="url(#shirt3d)" />
              <ellipse cx="44" cy="73" rx="6" ry="12" fill="#ffffff" opacity="0.25" />
              <line x1="34" y1="64" x2="18" y2="74" stroke="#312e81" strokeWidth="6" strokeLinecap="round" />
              <line x1="66" y1="64" x2="82" y2="74" stroke="#312e81" strokeWidth="6" strokeLinecap="round" />
              <circle cx="50" cy="32" r="24" fill="url(#skin3d)" />
              <ellipse cx="41" cy="23" rx="9" ry="6" fill="#ffffff" opacity="0.65" />
              <circle cx="42" cy="30" r="3.4" fill="#111" />
              <circle cx="58" cy="30" r="3.4" fill="#111" />
              <circle cx="43.2" cy="28.8" r="1.1" fill="#fff" />
              <circle cx="59.2" cy="28.8" r="1.1" fill="#fff" />
              <path d="M40 45 Q50 38 60 45" stroke="#7c2d12" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M76 20 q8 10 0 18 q-8 -8 0 -18" fill="url(#sweat3d)" className="sweat" />
            </g>
          </svg>
          <div className="toon-cap">Running from account to account… so tiring.</div>
        </div>

        <div className="scene scene-sad">
          <svg className="toon cloud" viewBox="0 0 120 60">
            <ellipse cx="45" cy="38" rx="26" ry="16" fill="#94a3b8" />
            <ellipse cx="70" cy="32" rx="24" ry="18" fill="#94a3b8" />
            <ellipse cx="92" cy="40" rx="18" ry="13" fill="#94a3b8" />
            <line x1="45" y1="52" x2="40" y2="60" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" className="rain" />
            <line x1="65" y1="52" x2="60" y2="60" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" className="rain r2" />
            <line x1="85" y1="52" x2="80" y2="60" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" className="rain r3" />
          </svg>
          <svg className="toon sadtoon" viewBox="0 0 80 104">
            <circle cx="40" cy="28" r="20" fill="#ffd9b3" />
            <circle cx="33" cy="25" r="3" fill="#111" />
            <circle cx="47" cy="25" r="3" fill="#111" />
            <path d="M31 41 Q40 33 49 41" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M50 30 q4 7 0 12 q-4 -5 0 -12" fill="#38bdf8" />
            <rect x="28" y="50" width="24" height="30" rx="10" fill="#6b7280" />
          </svg>
          <div className="toon-cap">So many apps. So sad.</div>
        </div>

        <div className="scene scene-home">
          <div className="room">
            <div className="link-badge">ONE LINK</div>
            <div className="lamp" />
            <div className="bed">
              <div className="pillow" />
              <div className="blanket" />
            </div>
            <svg className="toon happytoon" viewBox="0 0 80 104">
              <circle cx="40" cy="28" r="20" fill="#ffd9b3" />
              <circle cx="33" cy="25" r="3" fill="#111" />
              <circle cx="47" cy="25" r="3" fill="#111" />
              <circle cx="28" cy="32" r="3.5" fill="#fda4af" />
              <circle cx="52" cy="32" r="3.5" fill="#fda4af" />
              <path d="M31 33 Q40 43 49 33" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <rect x="28" y="50" width="24" height="30" rx="10" fill="#16a34a" />
              <line x1="28" y1="58" x2="14" y2="48" stroke="#111" strokeWidth="4" strokeLinecap="round" />
              <line x1="52" y1="58" x2="66" y2="48" stroke="#111" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span className="zzz z1">z</span>
            <span className="zzz z2">z</span>
            <span className="zzz z3">z</span>
          </div>
          <div className="toon-cap">One Link appears… relax. Everything is right here in your room.</div>
        </div>
      </div>

      <div className="flow-strip">
        <span className="flow-step f1">Create</span>
        <span className="flow-arrow">→</span>
        <span className="flow-step f2">Optimize</span>
        <span className="flow-arrow">→</span>
        <span className="flow-step f3">Publish</span>
        <span className="flow-arrow">→</span>
        <span className="flow-step f4">Monitor</span>
      </div>
      <div className="row">
        <button className="btn" onClick={onReplay}>
          Replay story
        </button>
      </div>
    </div>
  );
}

export default function Home({ go }: { go: (s: Section) => void }) {
  const { data: session } = useSession();
  const [mode, setMode] = useState<null | "signup" | "signin">(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [replay, setReplay] = useState(0);
  const [counts, setCounts] = useState<{ drafts: number; scheduled: number } | null>(null);

  useEffect(() => {
    if (!session) return;
    Promise.all([api.get("/api/projects"), api.get("/api/schedules")])
      .then(([p, s]) => setCounts({ drafts: p.length, scheduled: s.length }))
      .catch(() => {});
  }, [session]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res =
      mode === "signup"
        ? await signUp.email({ name, email, password })
        : await signIn.email({ email, password });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? "Something went wrong.");
      return;
    }
    setMode(null);
  }

  if (!session) {
    return (
      <>
        <div className="hero-strip creator-hero">
          <div className="creator-hero-head">
            <div>
              <span className="eyebrow">Creator engine</span>
              <h1>Welcome to One Link Studio</h1>
            </div>
            <div className="signal-pill">Live</div>
          </div>
          <p>Create once. Reach everywhere. Your whole social workflow lives here.</p>
          <div className="platform-row">
            {['TikTok', 'Instagram', 'LinkedIn', 'X', 'Facebook'].map((platform) => (
              <span key={platform} className="platform-tag">
                {platform}
              </span>
            ))}
          </div>
          {!mode ? (
            <div className="row">
              <button className="btn btn-dark" onClick={() => setMode("signup")}>
                Get started free
              </button>
              <button className="btn" onClick={() => setMode("signin")}>
                I have an account
              </button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ marginTop: 12 }}>
              <h3 style={{ margin: "0 0 8px" }}>
                {mode === "signup" ? "Create your free account" : "Welcome back"}
              </h3>
              {mode === "signup" && (
                <>
                  <label>
                    Name
                    <input required value={name} onChange={(e) => setName(e.target.value)} />
                  </label>
                  <br />
                  <br />
                </>
              )}
              <label>
                Email
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <br />
              <br />
              <label>
                Password
                <input
                  required
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {error && <p style={{ color: "#fecaca" }}>{error}</p>}
              <div className="row">
                <button className="btn btn-dark" type="submit" disabled={busy}>
                  {busy ? "Please wait…" : mode === "signup" ? "Sign up with email" : "Sign in with email"}
                </button>
                <button className="btn" type="button" onClick={() => setMode(null)}>
                  Back
                </button>
              </div>
            </form>
          )}
        </div>

        <Trailer replayKey={replay} onReplay={() => setReplay((r) => r + 1)} />

        <div className="grid">
          <div className="card creator-card">
            <h3>Create</h3>
            <p>Video, graphics, writing, and audio in one studio.</p>
            <div className="stat-stack">
              <span>12 ideas</span>
              <strong>Ready</strong>
            </div>
            <div className="row">
              <button className="btn btn-dark" onClick={() => setMode("signup")}>
                Try it free
              </button>
            </div>
          </div>
          <div className="card creator-card">
            <h3>Publish everywhere</h3>
            <p>One post adapted for every platform, scheduled in one click.</p>
            <div className="stat-stack">
              <span>5 networks</span>
              <strong>Connected</strong>
            </div>
            <div className="row">
              <button className="btn btn-dark" onClick={() => setMode("signup")}>
                Try it free
              </button>
            </div>
          </div>
          <div className="card creator-card">
            <h3>Understand growth</h3>
            <p>One dashboard, plain-language coaching, next-idea tips.</p>
            <div className="stat-stack">
              <span>+28%</span>
              <strong>Engagement</strong>
            </div>
            <div className="row">
              <button className="btn btn-dark" onClick={() => setMode("signup")}>
                Try it free
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const firstName = session.user.name?.split(" ")[0] || "creator";
  return (
    <>
      <div className="hero-strip creator-hero">
        <div className="creator-hero-head">
          <div>
            <span className="eyebrow">Creator overview</span>
            <h1>
              {greeting()}, {firstName}
            </h1>
          </div>
          <div className="signal-pill">+18%</div>
        </div>
        <p>
          {counts
            ? `You have ${counts.drafts} draft${counts.drafts === 1 ? "" : "s"} and ${counts.scheduled} scheduled post${counts.scheduled === 1 ? "" : "s"}.`
            : "Your studio is ready — pick what to do next."}
        </p>
        <div className="stat-row">
          <div className="mini-stat">
            <span>Reach</span>
            <strong>24.2K</strong>
          </div>
          <div className="mini-stat">
            <span>Engagement</span>
            <strong>7.4%</strong>
          </div>
          <div className="mini-stat">
            <span>Posts</span>
            <strong>18</strong>
          </div>
        </div>
        <div className="row">
          <button className="btn btn-dark" onClick={() => go("Create")}>
            New draft
          </button>
          <button className="btn" onClick={() => go("Trends")}>
            View trends
          </button>
          <button className="btn" onClick={() => go("Planner")}>
            Open planner
          </button>
          <button className="btn" onClick={() => go("Assistant")}>
            Ask assistant
          </button>
        </div>
      </div>

      <Trailer replayKey={replay} onReplay={() => setReplay((r) => r + 1)} />

      <div className="grid">
        <div className="card creator-card">
          <h3>Today</h3>
          <p>2 drafts · 1 scheduled post · 3 trends match your niche.</p>
          <div className="stat-stack">
            <span>Priority</span>
            <strong>Reels</strong>
          </div>
          <div className="row">
            <button className="btn btn-dark" onClick={() => go("Planner")}>
              Open Planner
            </button>
          </div>
        </div>
        <div className="card creator-card">
          <h3>Trending now</h3>
          <div className="platform-row">
            <span className="platform-tag">#JubaFashion</span>
            <span className="platform-tag">Hook styles</span>
            <span className="platform-tag">Sounds</span>
          </div>
        </div>
        <div className="card creator-card">
          <h3>Next recommendation</h3>
          <p>Repurpose your teaser hook into tomorrow's TikTok.</p>
          <div className="stat-stack">
            <span>Suggested</span>
            <strong>Video</strong>
          </div>
          <div className="row">
            <button className="btn btn-dark" onClick={() => go("Create")}>
              Create This
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
