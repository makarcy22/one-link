import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Section } from "../lib/sections";

type Studio = "write" | "graphic" | "upload" | "ai";

interface Draft {
  id: string;
  type: string;
  title: string;
  status: string;
}

interface Upload {
  id: string;
  kind: string;
  filename: string;
  mime: string;
  size_bytes: number;
}

const GRAPHIC_THEMES = [
  { name: "Bold", bg: "#111827", accent: "#ff5a1f", text: "#ffffff" },
  { name: "Fresh", bg: "#ecfdf5", accent: "#16a34a", text: "#111827" },
  { name: "Royal", bg: "#4f46e5", accent: "#06b6d4", text: "#ffffff" },
];

function posterSvg(headline: string, sub: string, theme: (typeof GRAPHIC_THEMES)[number]) {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
<rect width="1080" height="1080" fill="${theme.bg}"/>
<rect x="90" y="90" width="180" height="24" rx="12" fill="${theme.accent}"/>
<text x="90" y="480" font-family="Arial, sans-serif" font-size="96" font-weight="bold" fill="${theme.text}">${esc(headline) || "Your headline"}</text>
<text x="90" y="600" font-family="Arial, sans-serif" font-size="52" fill="${theme.text}" opacity="0.85">${esc(sub) || "Your subtext"}</text>
<text x="90" y="960" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="${theme.accent}">ONE LINK</text>
</svg>`;
}

export default function Create({ go }: { go: (s: Section) => void }) {
  void go;
  const [studio, setStudio] = useState<Studio>("write");

  // Write studio
  const [text, setText] = useState("");
  const [tone, setTone] = useState("Casual");
  const [platform, setPlatform] = useState("tiktok");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  // Graphic studio
  const [headline, setHeadline] = useState("");
  const [sub, setSub] = useState("");
  const [themeIdx, setThemeIdx] = useState(0);

  // Upload studio
  const [uploads, setUploads] = useState<Upload[]>([]);

  // AI bench
  const [topic, setTopic] = useState("");
  const [hooks, setHooks] = useState<string[]>([]);
  const [niche, setNiche] = useState("");
  const [ideas, setIdeas] = useState<string[]>([]);

  // Drafts
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function loadDrafts() {
    try {
      setDrafts(await api.get("/api/projects"));
    } catch {
      setDrafts([]);
    }
  }

  async function loadUploads() {
    try {
      setUploads(await api.get("/api/media"));
    } catch {
      setUploads([]);
    }
  }

  useEffect(() => {
    loadDrafts();
    loadUploads();
  }, []);

  async function generateCaption() {
    if (!text.trim()) {
      setNotice("Write something first.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const res = await api.post("/api/ai/caption", { text, tone, platform });
      setCaption(res.caption);
      setTags(res.hashtags || []);
    } catch {
      setNotice("Generation failed — is the API running and are you signed in?");
    }
    setBusy(false);
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Copied to clipboard.");
    } catch {
      setNotice("Copy failed — select the text manually.");
    }
  }

  async function saveDraft() {
    setNotice("Saving…");
    try {
      await api.post("/api/projects", {
        title: text.slice(0, 60) || "Untitled",
        body: caption ? `${text}\n\n${caption}\n\n${tags.join(" ")}` : text,
        type: "written",
        status: "draft",
      });
      setNotice("Saved to your library.");
      await loadDrafts();
    } catch {
      setNotice("Save failed — is the API running and are you signed in?");
    }
  }

  function downloadPoster() {
    const svg = posterSvg(headline, sub, GRAPHIC_THEMES[themeIdx]);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "one-link-poster.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function uploadFile(file: File) {
    setNotice("Uploading…");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("http://localhost:3000/api/media/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      setNotice("Upload complete.");
      await loadUploads();
    } catch {
      setNotice("Upload failed — is the API running and are you signed in?");
    }
  }

  async function removeUpload(id: string) {
    await api.del(`/api/media/${id}`).catch(() => {});
    await loadUploads();
  }

  async function fetchHooks() {
    if (!topic.trim()) return;
    try {
      const res = await api.post("/api/ai/hooks", { topic });
      setHooks(res.hooks || []);
    } catch {
      setNotice("Could not reach the AI service.");
    }
  }

  async function fetchIdeas() {
    try {
      const res = await api.post("/api/ai/ideas", { niche });
      setIdeas(res.ideas || []);
    } catch {
      setNotice("Could not reach the AI service.");
    }
  }

  return (
    <>
      <h2>Creation Studio</h2>
      <p className="muted">Make something real — then publish it from Planner.</p>
      <div className="row">
        {(["write", "graphic", "upload", "ai"] as Studio[]).map((s) => (
          <button
            key={s}
            className={studio === s ? "btn btn-dark" : "btn"}
            onClick={() => setStudio(s)}
          >
            {s === "write" ? "Write" : s === "graphic" ? "Graphic" : s === "upload" ? "Upload" : "AI bench"}
          </button>
        ))}
      </div>
      {notice && <p className="muted">{notice}</p>}

      {studio === "write" && (
        <div className="card">
          <h3>Write your post</h3>
          <textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's the post about?"
          />
          <p>
            {words} words · {text.length} characters
          </p>
          <div className="row">
            <label>
              Tone
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                {["Casual", "Professional", "Funny", "Inspirational", "Promotional"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Platform
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {["tiktok", "instagram", "facebook", "linkedin", "whatsapp"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="row">
            <button className="btn btn-hero" onClick={generateCaption} disabled={busy}>
              {busy ? "Generating…" : "Generate caption + hashtags"}
            </button>
          </div>
          {caption && (
            <>
              <h3>Result (editable)</h3>
              <textarea rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} />
              <p>{tags.join(" ")}</p>
              <div className="row">
                <button className="btn" onClick={() => copyText(`${caption}\n\n${tags.join(" ")}`)}>
                  Copy all
                </button>
                <button className="btn btn-dark" onClick={saveDraft}>
                  Save to library
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {studio === "graphic" && (
        <div className="card">
          <h3>Poster maker</h3>
          <label>
            Headline
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Friday drop is live" />
          </label>
          <br />
          <br />
          <label>
            Subtext
            <input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="New collection · link in bio" />
          </label>
          <p>Theme</p>
          <div className="row">
            {GRAPHIC_THEMES.map((t, i) => (
              <button key={t.name} className={themeIdx === i ? "btn btn-dark" : "btn"} onClick={() => setThemeIdx(i)}>
                {t.name}
              </button>
            ))}
          </div>
          <div
            style={{ maxWidth: 360, marginTop: 12 }}
            dangerouslySetInnerHTML={{ __html: posterSvg(headline, sub, GRAPHIC_THEMES[themeIdx]) }}
          />
          <div className="row">
            <button className="btn btn-hero" onClick={downloadPoster}>
              Download poster
            </button>
          </div>
        </div>
      )}

      {studio === "upload" && (
        <div className="card">
          <h3>Upload media</h3>
          <p>Video, photos, audio — stored in your library for repurposing.</p>
          <input
            type="file"
            accept="video/*,image/*,audio/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
              e.target.value = "";
            }}
          />
          <h3>My uploads ({uploads.length})</h3>
          {uploads.length === 0 && <p>No uploads yet.</p>}
          {uploads.map((u) => (
            <p key={u.id}>
              [{u.kind}] {u.filename} · {(u.size_bytes / 1024).toFixed(0)} KB{" "}
              <button className="btn" onClick={() => removeUpload(u.id)}>
                Delete
              </button>
            </p>
          ))}
        </div>
      )}

      {studio === "ai" && (
        <div className="card">
          <h3>Hook bench</h3>
          <label>
            Topic
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="starting a business" />
          </label>
          <div className="row">
            <button className="btn btn-dark" onClick={fetchHooks}>
              Generate hooks
            </button>
          </div>
          {hooks.map((h) => (
            <div className="bubble" key={h}>
              {h}{" "}
              <button className="btn" onClick={() => copyText(h)}>
                Copy
              </button>
            </div>
          ))}
          <h3>Idea bench</h3>
          <label>
            Niche
            <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="fashion" />
          </label>
          <div className="row">
            <button className="btn btn-dark" onClick={fetchIdeas}>
              Generate ideas
            </button>
          </div>
          {ideas.map((i) => (
            <div className="bubble" key={i}>
              {i}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>My drafts ({drafts.length})</h3>
        {drafts.length === 0 && <p>No drafts yet — create something above.</p>}
        {drafts.map((d) => (
          <p key={d.id}>
            [{d.type}] {d.title} · {d.status}
          </p>
        ))}
      </div>
    </>
  );
}
