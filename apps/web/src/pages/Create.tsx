import { useEffect, useMemo, useRef, useState } from "react";
import { GRAPHIC_TEMPLATES, THEMES, PLATFORMS, platformLabel, normalizeHashtags, renderTemplate, type Variant, type ScoredTag } from "@one-link/shared";
import { api, errorText } from "../lib/api";
import { toLocalInput } from "../lib/format";
import { takeHandoff, type Section } from "../lib/sections";
import { Empty, Icon, PageHead, PlatformDot, useToast } from "../components/ui";

type Tab = "write" | "graphic" | "upload" | "ai" | "library";
interface Upload { id: string; kind: string; filename: string; size_bytes: number }
interface SavedCaption { id: string; title: string; body: string; hashtags: string[] }
interface UserTemplate { id: string; name: string; data: { template?: string; theme?: string; values?: Record<string, string> } }
const NETS = ["facebook", "instagram", "tiktok", "linkedin", "x", "whatsapp"] as const;
const MODE_LABEL = { direct: "We post it", soon: "Prepared, you post", manual: "Prepared, you post" } as const;

function defaultWhen(): string {
  const d = new Date(Date.now() + 3600_000);
  d.setMinutes(0, 0, 0);
  return toLocalInput(d);
}

export default function Create({ go }: { go: (s: Section) => void }) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("write");

  // ---- composer ----
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [picked, setPicked] = useState<string[]>(["facebook"]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [mediaId, setMediaId] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [variants, setVariants] = useState<Variant[]>([]);
  const [when, setWhen] = useState(defaultWhen);
  const [busy, setBusy] = useState(false);
  const [suggest, setSuggest] = useState<{ suggestions: ScoredTag[]; notes: string[] } | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [aiTone, setAiTone] = useState("Casual");

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [captions, setCaptions] = useState<SavedCaption[]>([]);
  const [templates, setTemplates] = useState<UserTemplate[]>([]);

  // ---- graphic ----
  const [tplId, setTplId] = useState(GRAPHIC_TEMPLATES[0].id);
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [gvals, setGvals] = useState<Record<string, string>>({});

  // ---- AI bench ----
  const [topic, setTopic] = useState("");
  const [hooks, setHooks] = useState<string[]>([]);
  const [niche, setNiche] = useState("");
  const [ideas, setIdeas] = useState<string[]>([]);

  const seq = useRef(0);
  const tpl = GRAPHIC_TEMPLATES.find((t) => t.id === tplId)!;
  const svg = useMemo(() => renderTemplate(tplId, gvals, themeId), [tplId, gvals, themeId]);

  async function loadLists() {
    api.get("/api/media").then(setUploads).catch(() => setUploads([]));
    api.get("/api/library/captions").then(setCaptions).catch(() => setCaptions([]));
    api.get("/api/library/templates").then(setTemplates).catch(() => setTemplates([]));
  }
  useEffect(() => {
    const h = takeHandoff();
    if (h.text) setText(h.text);
    if (h.tags) setTags(normalizeHashtags(h.tags.split(/\s+/)));
    loadLists();
  }, []);

  // Live review: what each network will receive.
  useEffect(() => {
    if (!text.trim() || picked.length === 0) { setVariants([]); return; }
    const my = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const v: Record<string, { caption: string }> = {};
        for (const p of picked) if (edits[p] !== undefined) v[p] = { caption: edits[p] };
        const r = await api.post("/api/variants/preview", { text, platforms: picked, hashtags: tags, link, media_id: mediaId || undefined, variants: v });
        if (my === seq.current) setVariants(r.variants);
      } catch { if (my === seq.current) setVariants([]); }
    }, 350);
    return () => clearTimeout(t);
  }, [text, picked, tags, link, mediaId, edits]);

  const blockers = variants.filter((v) => v.blockers.length > 0);
  const toggleNet = (p: string) => setPicked((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p]));
  const addTag = (raw: string) => setTags((cur) => normalizeHashtags([...cur, ...raw.split(/[\s,]+/)]));

  async function getSuggestions() {
    setSuggesting(true);
    try { setSuggest(await api.post("/api/hashtags/suggest", { text, platform: picked[0] ?? "instagram" })); }
    catch (e) { toast(errorText(e), "bad"); }
    setSuggesting(false);
  }

  async function aiImprove() {
    if (!text.trim()) return toast("Write a rough idea first.", "bad");
    setBusy(true);
    try {
      const r = await api.post("/api/ai/caption", { text, tone: aiTone, platform: picked[0] ?? "facebook" });
      setText(r.caption);
      if (r.hashtags?.length) addTag(r.hashtags.join(" "));
      toast("Caption written. Edit it however you like.");
    } catch (e) { toast(errorText(e), "bad"); }
    setBusy(false);
  }

  async function schedule(now: boolean) {
    if (!text.trim()) return toast("Write something to post first.", "bad");
    if (picked.length === 0) return toast("Pick at least one network.", "bad");
    if (blockers.length) return toast(`${blockers[0].platform}: ${blockers[0].blockers[0]}`, "bad");
    setBusy(true);
    try {
      const v: Record<string, { caption: string }> = {};
      for (const p of picked) if (edits[p] !== undefined) v[p] = { caption: edits[p] };
      const at = now ? new Date() : new Date(when);
      const s = await api.post("/api/schedules", { text, platforms: picked, hashtags: tags, link, media_id: mediaId || undefined, variants: v, scheduled_at: at.toISOString() });
      if (now) await api.post(`/api/schedules/${s.id}/publish-now`, {});
      toast(now ? "Sending now. Watch Planner for the result." : "Scheduled. It is in your Planner.");
      setText(""); setTags([]); setEdits({}); setLink(""); setMediaId("");
      go("Planner");
    } catch (e) { toast(errorText(e), "bad"); }
    setBusy(false);
  }

  async function saveDraft() {
    try { await api.post("/api/projects", { title: text.slice(0, 60) || "Untitled", body: text, type: "written", status: "draft" }); toast("Saved as a draft."); }
    catch (e) { toast(errorText(e), "bad"); }
  }
  async function saveCaption() {
    try { await api.post("/api/library/captions", { body: text, hashtags: tags, platform: picked[0] }); toast("Saved to your library."); loadLists(); }
    catch (e) { toast(errorText(e), "bad"); }
  }
  async function copy(v: string) {
    try { await navigator.clipboard.writeText(v); toast("Copied."); } catch { toast("Copy did not work. Select the text and copy it.", "bad"); }
  }

  async function onUpload(file: File) {
    try { await api.upload(file); toast("Uploaded."); loadLists(); } catch (e) { toast(errorText(e), "bad"); }
  }

  function downloadSvg() {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url; a.download = `one-link-${tplId}.svg`; a.click();
    URL.revokeObjectURL(url);
  }
  async function saveTemplate() {
    const name = (gvals[tpl.fields[0].key] || tpl.name).slice(0, 40);
    try { await api.post("/api/library/templates", { name, kind: "graphic", data: { template: tplId, theme: themeId, values: gvals } }); toast("Template saved."); loadLists(); }
    catch (e) { toast(errorText(e), "bad"); }
  }

  const tabs: [Tab, string][] = [["write", "Write"], ["graphic", "Graphic"], ["upload", "Upload"], ["ai", "AI helper"], ["library", "Library"]];

  return (
    <>
      <PageHead title="Create" sub="Write once. Review what each network gets. Post now or pick a time." />
      <div className="seg" role="tablist" style={{ marginBottom: 16 }}>
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === "write" && (
        <div className="split">
          <div>
            <div className="card">
              <label className="field" htmlFor="c-text">Your post
                <textarea id="c-text" rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="What do you want to tell people?" />
              </label>
              <div className="row">
                <select id="c-tone" aria-label="Tone" value={aiTone} onChange={(e) => setAiTone(e.target.value)} style={{ width: "auto" }}>
                  {["Casual", "Professional", "Funny", "Inspirational", "Promotional"].map((t) => <option key={t}>{t}</option>)}
                </select>
                <button className="btn btn-sm" onClick={aiImprove} disabled={busy}><Icon name="spark" size={16} />Improve with AI</button>
                <button className="btn btn-sm btn-quiet" onClick={saveCaption} disabled={!text.trim()}>Save caption</button>
                <button className="btn btn-sm btn-quiet" onClick={saveDraft} disabled={!text.trim()}>Save draft</button>
              </div>
            </div>

            <div className="card">
              <h3>Where to post</h3>
              <div className="row" style={{ marginTop: 0 }}>
                {NETS.map((p) => (
                  <button key={p} className={`chip${picked.includes(p) ? " on" : ""}`} aria-pressed={picked.includes(p)} onClick={() => toggleNet(p)}>
                    {platformLabel(p)}
                  </button>
                ))}
              </div>
              <p className="muted small">Facebook Pages are posted for you. Other networks are prepared and we remind you at the time you choose.</p>
              <div className="row">
                <label className="field" htmlFor="c-link" style={{ flex: "1 1 220px" }}>Link (optional)<input id="c-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://yourshop.com/new" /></label>
                <label className="field" htmlFor="c-media" style={{ flex: "1 1 200px" }}>Picture or video
                  <select id="c-media" value={mediaId} onChange={(e) => setMediaId(e.target.value)}>
                    <option value="">None</option>{uploads.map((u) => <option key={u.id} value={u.id}>{u.filename}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="card">
              <h3>Hashtags</h3>
              <div>{tags.map((t) => <button key={t} className="chip on" aria-label={`Remove ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}>{t} <Icon name="x" size={12} /></button>)}{tags.length === 0 && <span className="muted small">None yet.</span>}</div>
              <div className="row">
                <input aria-label="Add a hashtag" id="c-tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addTag(tagInput); setTagInput(""); } }} placeholder="#YourTag" style={{ flex: "1 1 160px" }} />
                <button className="btn btn-sm" onClick={() => { addTag(tagInput); setTagInput(""); }}>Add</button>
                <button className="btn btn-sm btn-dark" onClick={getSuggestions} disabled={suggesting}>{suggesting ? "Checking…" : "Suggest for this post"}</button>
              </div>
              {suggest && (
                <div style={{ marginTop: 12 }}>
                  {suggest.notes.map((n) => <p key={n} className="notice notice-info">{n}</p>)}
                  {suggest.suggestions.map((s) => (
                    <div key={s.tag} className="tag-row">
                      <span className={`score ${s.tier}`} aria-label={`Fit ${s.score} out of 100`}>{s.score}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b>{s.tag}</b> <span className="muted small">{s.tier === "strong" ? "Strong fit" : s.tier === "ok" ? "Decent fit" : "Weak fit"}</span>
                        <div className="muted small">{s.reasons.join(" · ")}</div>
                        {s.cautions.map((c) => <div key={c} className="small" style={{ color: "var(--warn)" }}>{c}</div>)}
                      </div>
                      <button className="btn btn-sm" disabled={tags.includes(s.tag)} onClick={() => addTag(s.tag)}>{tags.includes(s.tag) ? "Added" : "Add"}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ position: "sticky", top: 12 }}>
            <div className="card">
              <h3>Review before it goes out</h3>
              {variants.length === 0 ? (
                <Empty title="Your versions appear here">Write your post and pick a network. You will see exactly what each one receives.</Empty>
              ) : (
                <div className="stack">
                  {variants.map((v) => {
                    const info = PLATFORMS[v.platform];
                    const pct = Math.min(100, Math.round((v.chars / v.limit) * 100));
                    return (
                      <div key={v.platform} className="variant">
                        <div className="variant-head">
                          <strong><PlatformDot platform={v.platform} />{platformLabel(v.platform)}</strong>
                          <span className={`pill ${info.mode === "direct" ? "pill-good" : "pill-warn"}`}>{MODE_LABEL[info.mode]}</span>
                        </div>
                        <textarea aria-label={`${platformLabel(v.platform)} caption`} rows={3} value={edits[v.platform] ?? v.caption} onChange={(e) => setEdits({ ...edits, [v.platform]: e.target.value })} />
                        <div className={`meter${v.fits ? "" : " over"}`}><i style={{ width: `${pct}%` }} /></div>
                        <div className="muted small mono">{v.chars} / {v.limit} characters{edits[v.platform] !== undefined && <> · <button className="btn btn-sm btn-quiet" style={{ minHeight: 0, padding: "0 6px" }} onClick={() => { const { [v.platform]: _drop, ...rest } = edits; void _drop; setEdits(rest); }}>Reset</button></>}</div>
                        {v.blockers.map((b) => <div key={b} className="notice notice-bad">{b}</div>)}
                        {v.warnings.map((w) => <div key={w} className="muted small">• {w}</div>)}
                        <details><summary className="small muted" style={{ cursor: "pointer" }}>Exactly what is sent</summary><div className="preview-post">{v.final}</div>
                          <button className="btn btn-sm btn-quiet" onClick={() => copy(v.final)}><Icon name="copy" size={14} />Copy</button></details>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                <label className="field" htmlFor="c-when" style={{ flex: "1 1 200px" }}>Post at<input id="c-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
              </div>
              <div className="row">
                <button className="btn btn-hero" disabled={busy || !text.trim() || picked.length === 0 || blockers.length > 0} onClick={() => schedule(false)}><Icon name="clock" size={16} />Schedule</button>
                <button className="btn" disabled={busy || !text.trim() || picked.length === 0 || blockers.length > 0} onClick={() => schedule(true)}>Post now</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "graphic" && (
        <div className="split">
          <div className="card">
            <h3>Pick a layout</h3>
            <div className="row" style={{ marginTop: 0 }}>{GRAPHIC_TEMPLATES.map((t) => <button key={t.id} className={`chip${tplId === t.id ? " on" : ""}`} aria-pressed={tplId === t.id} onClick={() => { setTplId(t.id); setGvals({}); }}>{t.name}</button>)}</div>
            <p className="muted small">{tpl.description} {tpl.width}×{tpl.height}</p>
            <div className="stack">
              {tpl.fields.map((f) => (
                <label key={f.key} className="field" htmlFor={`g-${f.key}`}>{f.label}
                  {f.multiline ? <textarea id={`g-${f.key}`} rows={3} maxLength={f.max} value={gvals[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setGvals({ ...gvals, [f.key]: e.target.value })} />
                    : <input id={`g-${f.key}`} maxLength={f.max} value={gvals[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setGvals({ ...gvals, [f.key]: e.target.value })} />}
                </label>
              ))}
            </div>
            <p className="stat-label" style={{ marginTop: 14 }}>Colours</p>
            <div className="row" style={{ marginTop: 4 }}>{THEMES.map((t) => <button key={t.id} className={`chip${themeId === t.id ? " on" : ""}`} aria-pressed={themeId === t.id} onClick={() => setThemeId(t.id)}><span className="pdot" style={{ background: t.bg, border: "1px solid var(--line)", marginRight: 0 }} /><span className="pdot" style={{ background: t.accent, marginRight: 0 }} />{t.name}</button>)}</div>
            <div className="row"><button className="btn btn-hero" onClick={downloadSvg}><Icon name="upload" size={16} />Download</button><button className="btn" onClick={saveTemplate}><Icon name="save" size={16} />Save as template</button></div>
          </div>
          <div className="card" style={{ position: "sticky", top: 12 }}>
            <div style={{ maxWidth: tpl.height > tpl.width ? 280 : 420, margin: "0 auto", borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }} dangerouslySetInnerHTML={{ __html: svg.replace(/width="\d+" height="\d+"/, 'width="100%" style="display:block;height:auto"') }} />
          </div>
        </div>
      )}

      {tab === "upload" && (
        <div className="card">
          <h3>Your files</h3>
          <p className="muted">Pictures and videos you can attach to a post. Pictures can be posted to Facebook automatically once public file storage is on.</p>
          <input id="up-file" type="file" aria-label="Choose a file" accept="video/*,image/*,audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
          <div className="list" style={{ marginTop: 12 }}>
            {uploads.length === 0 && <Empty title="No files yet">Choose a picture or video above.</Empty>}
            {uploads.map((u) => (
              <div key={u.id} className="list-item">
                <div className="grow"><div className="title">{u.filename}</div><div className="muted small">{u.kind} · {(u.size_bytes / 1024).toFixed(0)} KB</div></div>
                <button className="btn btn-sm" onClick={() => { setMediaId(u.id); setTab("write"); toast("Attached to your post."); }}>Attach</button>
                <button className="btn btn-sm btn-quiet" aria-label={`Delete ${u.filename}`} onClick={async () => { await api.del(`/api/media/${u.id}`).catch(() => {}); loadLists(); }}><Icon name="trash" size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "ai" && (
        <div className="grid">
          <div className="card">
            <h3>Hook ideas</h3>
            <label className="field" htmlFor="ai-topic">Topic<input id="ai-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Starting a small business" /></label>
            <div className="row"><button className="btn btn-dark" onClick={async () => { if (!topic.trim()) return; try { setHooks((await api.post("/api/ai/hooks", { topic })).hooks || []); } catch (e) { toast(errorText(e), "bad"); } }}>Write hooks</button></div>
            {hooks.map((h) => <div className="bubble" key={h}>{h} <button className="btn btn-sm btn-quiet" onClick={() => { setText(h); setTab("write"); }}>Use</button></div>)}
          </div>
          <div className="card">
            <h3>Post ideas</h3>
            <label className="field" htmlFor="ai-niche">Your topic<input id="ai-niche" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Fashion" /></label>
            <div className="row"><button className="btn btn-dark" onClick={async () => { try { setIdeas((await api.post("/api/ai/ideas", { niche })).ideas || []); } catch (e) { toast(errorText(e), "bad"); } }}>Find ideas</button></div>
            {ideas.map((i) => <div className="bubble" key={i}>{i} <button className="btn btn-sm btn-quiet" onClick={() => { setText(i); setTab("write"); }}>Use</button></div>)}
          </div>
        </div>
      )}

      {tab === "library" && (
        <div className="grid">
          <div className="card">
            <h3>Saved captions</h3>
            {captions.length === 0 && <Empty title="Nothing saved">Use “Save caption” on the Write tab to keep your best ones.</Empty>}
            {captions.map((c) => (
              <div key={c.id} className="list-item">
                <div className="grow"><div className="title">{c.title}</div><div className="muted small clip">{c.body}</div></div>
                <button className="btn btn-sm" onClick={() => { setText(c.body); setTags(c.hashtags); setTab("write"); }}>Use</button>
                <button className="btn btn-sm btn-quiet" aria-label="Delete caption" onClick={async () => { await api.del(`/api/library/captions/${c.id}`).catch(() => {}); loadLists(); }}><Icon name="trash" size={16} /></button>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>Saved templates</h3>
            {templates.length === 0 && <Empty title="Nothing saved">Design something in Graphic and choose “Save as template”.</Empty>}
            {templates.map((t) => (
              <div key={t.id} className="list-item">
                <div className="grow"><div className="title">{t.name}</div></div>
                <button className="btn btn-sm" onClick={() => { setTplId(t.data.template ?? GRAPHIC_TEMPLATES[0].id); setThemeId(t.data.theme ?? THEMES[0].id); setGvals(t.data.values ?? {}); setTab("graphic"); }}>Open</button>
                <button className="btn btn-sm btn-quiet" aria-label="Delete template" onClick={async () => { await api.del(`/api/library/templates/${t.id}`).catch(() => {}); loadLists(); }}><Icon name="trash" size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
