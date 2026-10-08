import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
const GRAPHIC_THEMES = [
    { name: "Bold", bg: "#111827", accent: "#ff5a1f", text: "#ffffff" },
    { name: "Fresh", bg: "#ecfdf5", accent: "#16a34a", text: "#111827" },
    { name: "Royal", bg: "#4f46e5", accent: "#06b6d4", text: "#ffffff" },
];
function posterSvg(headline, sub, theme) {
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
<rect width="1080" height="1080" fill="${theme.bg}"/>
<rect x="90" y="90" width="180" height="24" rx="12" fill="${theme.accent}"/>
<text x="90" y="480" font-family="Arial, sans-serif" font-size="96" font-weight="bold" fill="${theme.text}">${esc(headline) || "Your headline"}</text>
<text x="90" y="600" font-family="Arial, sans-serif" font-size="52" fill="${theme.text}" opacity="0.85">${esc(sub) || "Your subtext"}</text>
<text x="90" y="960" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="${theme.accent}">ONE LINK</text>
</svg>`;
}
export default function Create({ go }) {
    void go;
    const [studio, setStudio] = useState("write");
    // Write studio
    const [text, setText] = useState("");
    const [tone, setTone] = useState("Casual");
    const [platform, setPlatform] = useState("tiktok");
    const [caption, setCaption] = useState("");
    const [tags, setTags] = useState([]);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState("");
    // Graphic studio
    const [headline, setHeadline] = useState("");
    const [sub, setSub] = useState("");
    const [themeIdx, setThemeIdx] = useState(0);
    // Upload studio
    const [uploads, setUploads] = useState([]);
    // AI bench
    const [topic, setTopic] = useState("");
    const [hooks, setHooks] = useState([]);
    const [niche, setNiche] = useState("");
    const [ideas, setIdeas] = useState([]);
    // Drafts
    const [drafts, setDrafts] = useState([]);
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    async function loadDrafts() {
        try {
            setDrafts(await api.get("/api/projects"));
        }
        catch {
            setDrafts([]);
        }
    }
    async function loadUploads() {
        try {
            setUploads(await api.get("/api/media"));
        }
        catch {
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
        }
        catch {
            setNotice("Generation failed — is the API running and are you signed in?");
        }
        setBusy(false);
    }
    async function copyText(value) {
        try {
            await navigator.clipboard.writeText(value);
            setNotice("Copied to clipboard.");
        }
        catch {
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
        }
        catch {
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
    async function uploadFile(file) {
        setNotice("Uploading…");
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch("http://localhost:3000/api/media/upload", {
                method: "POST",
                body: form,
                credentials: "include",
            });
            if (!res.ok)
                throw new Error(await res.text());
            setNotice("Upload complete.");
            await loadUploads();
        }
        catch {
            setNotice("Upload failed — is the API running and are you signed in?");
        }
    }
    async function removeUpload(id) {
        await api.del(`/api/media/${id}`).catch(() => { });
        await loadUploads();
    }
    async function fetchHooks() {
        if (!topic.trim())
            return;
        try {
            const res = await api.post("/api/ai/hooks", { topic });
            setHooks(res.hooks || []);
        }
        catch {
            setNotice("Could not reach the AI service.");
        }
    }
    async function fetchIdeas() {
        try {
            const res = await api.post("/api/ai/ideas", { niche });
            setIdeas(res.ideas || []);
        }
        catch {
            setNotice("Could not reach the AI service.");
        }
    }
    return (_jsxs(_Fragment, { children: [_jsx("h2", { children: "Creation Studio" }), _jsx("p", { className: "muted", children: "Make something real \u2014 then publish it from Planner." }), _jsx("div", { className: "row", children: ["write", "graphic", "upload", "ai"].map((s) => (_jsx("button", { className: studio === s ? "btn btn-dark" : "btn", onClick: () => setStudio(s), children: s === "write" ? "Write" : s === "graphic" ? "Graphic" : s === "upload" ? "Upload" : "AI bench" }, s))) }), notice && _jsx("p", { className: "muted", children: notice }), studio === "write" && (_jsxs("div", { className: "card", children: [_jsx("h3", { children: "Write your post" }), _jsx("textarea", { rows: 6, value: text, onChange: (e) => setText(e.target.value), placeholder: "What's the post about?" }), _jsxs("p", { children: [words, " words \u00B7 ", text.length, " characters"] }), _jsxs("div", { className: "row", children: [_jsxs("label", { children: ["Tone", _jsx("select", { value: tone, onChange: (e) => setTone(e.target.value), children: ["Casual", "Professional", "Funny", "Inspirational", "Promotional"].map((t) => (_jsx("option", { children: t }, t))) })] }), _jsxs("label", { children: ["Platform", _jsx("select", { value: platform, onChange: (e) => setPlatform(e.target.value), children: ["tiktok", "instagram", "facebook", "linkedin", "whatsapp"].map((p) => (_jsx("option", { children: p }, p))) })] })] }), _jsx("div", { className: "row", children: _jsx("button", { className: "btn btn-hero", onClick: generateCaption, disabled: busy, children: busy ? "Generating…" : "Generate caption + hashtags" }) }), caption && (_jsxs(_Fragment, { children: [_jsx("h3", { children: "Result (editable)" }), _jsx("textarea", { rows: 4, value: caption, onChange: (e) => setCaption(e.target.value) }), _jsx("p", { children: tags.join(" ") }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "btn", onClick: () => copyText(`${caption}\n\n${tags.join(" ")}`), children: "Copy all" }), _jsx("button", { className: "btn btn-dark", onClick: saveDraft, children: "Save to library" })] })] }))] })), studio === "graphic" && (_jsxs("div", { className: "card", children: [_jsx("h3", { children: "Poster maker" }), _jsxs("label", { children: ["Headline", _jsx("input", { value: headline, onChange: (e) => setHeadline(e.target.value), placeholder: "Friday drop is live" })] }), _jsx("br", {}), _jsx("br", {}), _jsxs("label", { children: ["Subtext", _jsx("input", { value: sub, onChange: (e) => setSub(e.target.value), placeholder: "New collection \u00B7 link in bio" })] }), _jsx("p", { children: "Theme" }), _jsx("div", { className: "row", children: GRAPHIC_THEMES.map((t, i) => (_jsx("button", { className: themeIdx === i ? "btn btn-dark" : "btn", onClick: () => setThemeIdx(i), children: t.name }, t.name))) }), _jsx("div", { style: { maxWidth: 360, marginTop: 12 }, dangerouslySetInnerHTML: { __html: posterSvg(headline, sub, GRAPHIC_THEMES[themeIdx]) } }), _jsx("div", { className: "row", children: _jsx("button", { className: "btn btn-hero", onClick: downloadPoster, children: "Download poster" }) })] })), studio === "upload" && (_jsxs("div", { className: "card", children: [_jsx("h3", { children: "Upload media" }), _jsx("p", { children: "Video, photos, audio \u2014 stored in your library for repurposing." }), _jsx("input", { type: "file", accept: "video/*,image/*,audio/*", onChange: (e) => {
                            const f = e.target.files?.[0];
                            if (f)
                                uploadFile(f);
                            e.target.value = "";
                        } }), _jsxs("h3", { children: ["My uploads (", uploads.length, ")"] }), uploads.length === 0 && _jsx("p", { children: "No uploads yet." }), uploads.map((u) => (_jsxs("p", { children: ["[", u.kind, "] ", u.filename, " \u00B7 ", (u.size_bytes / 1024).toFixed(0), " KB", " ", _jsx("button", { className: "btn", onClick: () => removeUpload(u.id), children: "Delete" })] }, u.id)))] })), studio === "ai" && (_jsxs("div", { className: "card", children: [_jsx("h3", { children: "Hook bench" }), _jsxs("label", { children: ["Topic", _jsx("input", { value: topic, onChange: (e) => setTopic(e.target.value), placeholder: "starting a business" })] }), _jsx("div", { className: "row", children: _jsx("button", { className: "btn btn-dark", onClick: fetchHooks, children: "Generate hooks" }) }), hooks.map((h) => (_jsxs("div", { className: "bubble", children: [h, " ", _jsx("button", { className: "btn", onClick: () => copyText(h), children: "Copy" })] }, h))), _jsx("h3", { children: "Idea bench" }), _jsxs("label", { children: ["Niche", _jsx("input", { value: niche, onChange: (e) => setNiche(e.target.value), placeholder: "fashion" })] }), _jsx("div", { className: "row", children: _jsx("button", { className: "btn btn-dark", onClick: fetchIdeas, children: "Generate ideas" }) }), ideas.map((i) => (_jsx("div", { className: "bubble", children: i }, i)))] })), _jsxs("div", { className: "card", children: [_jsxs("h3", { children: ["My drafts (", drafts.length, ")"] }), drafts.length === 0 && _jsx("p", { children: "No drafts yet \u2014 create something above." }), drafts.map((d) => (_jsxs("p", { children: ["[", d.type, "] ", d.title, " \u00B7 ", d.status] }, d.id)))] })] }));
}
//# sourceMappingURL=Create.js.map