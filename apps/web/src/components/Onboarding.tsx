import { useState } from "react";
import { REGIONS } from "@one-link/shared";
import { api, errorText } from "../lib/api";
import { Logo } from "./ui";

const ROLES = [
  ["creator", "Creator", "I post as myself or my personal brand"],
  ["business", "Business", "I promote a shop, service or organisation"],
  ["agency", "Agency", "I manage content for other people"],
  ["other", "Something else", "I will figure it out as I go"],
];
const GOALS = [
  ["grow_audience", "Grow my audience"],
  ["sell_more", "Sell more"],
  ["save_time", "Save time"],
  ["stay_consistent", "Post consistently"],
  ["learn_trends", "Learn what works"],
];
const PLATFORMS = [["facebook", "Facebook"], ["instagram", "Instagram"], ["tiktok", "TikTok"], ["linkedin", "LinkedIn"], ["x", "X"], ["whatsapp", "WhatsApp"]];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [niche, setNiche] = useState("");
  const [region, setRegion] = useState("east_africa");
  const [goals, setGoals] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>(["facebook"]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, k: string) =>
    set(list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);

  async function finish() {
    setBusy(true);
    setErr("");
    try {
      await api.put("/api/prefs", { role, niche, region, goals, platforms, finish: true });
      onDone();
    } catch (e) {
      setErr(errorText(e));
    }
    setBusy(false);
  }

  const canNext = step === 0 ? !!role : step === 1 ? niche.trim().length > 1 : true;

  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-labelledby="ob-title">
      <div className="modal">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Logo />
          <span className="muted small">Set up takes about a minute</span>
        </div>
        <div className="steps" aria-hidden="true">{[0, 1, 2, 3].map((i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>

        {step === 0 && (
          <>
            <h2 id="ob-title">Who is One Link for?</h2>
            <p className="muted">This tunes the trends and ideas we show you.</p>
            <div className="choices">
              {ROLES.map(([k, l, s]) => (
                <button key={k} className={`choice${role === k ? " on" : ""}`} aria-pressed={role === k} onClick={() => setRole(k)}>{l}<small>{s}</small></button>
              ))}
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 id="ob-title">What do you post about?</h2>
            <p className="muted">A few words is enough. Examples: fashion, street food, tutoring, music.</p>
            <label className="field" htmlFor="ob-niche">Your topic
              <input id="ob-niche" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Fashion and tailoring" autoFocus />
            </label>
            <label className="field" htmlFor="ob-region" style={{ marginTop: 12 }}>Where is your audience?
              <select id="ob-region" value={region} onChange={(e) => setRegion(e.target.value)}>
                {REGIONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </label>
          </>
        )}
        {step === 2 && (
          <>
            <h2 id="ob-title">What do you want most?</h2>
            <p className="muted">Pick any that fit.</p>
            <div className="choices">
              {GOALS.map(([k, l]) => (
                <button key={k} className={`choice${goals.includes(k) ? " on" : ""}`} aria-pressed={goals.includes(k)} onClick={() => toggle(goals, setGoals, k)}>{l}</button>
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h2 id="ob-title">Where do you post?</h2>
            <p className="muted">Facebook Pages can be posted for you automatically. The others are prepared for you and we remind you when it is time.</p>
            <div className="choices">
              {PLATFORMS.map(([k, l]) => (
                <button key={k} className={`choice${platforms.includes(k) ? " on" : ""}`} aria-pressed={platforms.includes(k)} onClick={() => toggle(platforms, setPlatforms, k)}>{l}</button>
              ))}
            </div>
          </>
        )}
        {err && <p className="notice notice-bad">{err}</p>}
        <div className="row" style={{ justifyContent: "space-between" }}>
          <button className="btn btn-quiet" onClick={() => (step === 0 ? finish() : setStep(step - 1))} disabled={busy}>{step === 0 ? "Skip for now" : "Back"}</button>
          {step < 3 ? (
            <button className="btn btn-hero" disabled={!canNext} onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button className="btn btn-hero" disabled={busy} onClick={finish}>{busy ? "Saving…" : "Open my workspace"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
