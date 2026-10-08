import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
const PLATFORMS = ["tiktok", "instagram", "facebook", "linkedin", "whatsapp"];
export default function Planner({ go }) {
    void go;
    const [items, setItems] = useState([]);
    const [projects, setProjects] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [note, setNote] = useState("Loading…");
    const [projectId, setProjectId] = useState("");
    const [when, setWhen] = useState("");
    const [picked, setPicked] = useState(["tiktok"]);
    async function load() {
        try {
            const [s, p, j] = await Promise.all([
                api.get("/api/schedules"),
                api.get("/api/projects"),
                api.get("/api/publishing-jobs"),
            ]);
            setItems(s);
            setProjects(p);
            setJobs(j);
            if (p[0] && !projectId)
                setProjectId(p[0].id);
            setNote("");
        }
        catch {
            setNote("Could not reach the API — is it running and are you signed in?");
        }
    }
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    function toggle(p) {
        setPicked((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
    }
    async function createSchedule() {
        if (!projectId || !when || picked.length === 0) {
            setNote("Pick a project, a date/time, and at least one platform.");
            return;
        }
        setNote("Scheduling…");
        try {
            await api.post("/api/schedules", {
                project_id: projectId,
                platforms: JSON.stringify(picked),
                scheduled_at: new Date(when).toISOString(),
            });
            setNote("Scheduled.");
            await load();
        }
        catch {
            setNote("Scheduling failed.");
        }
    }
    async function publishNow(id) {
        setNote("Publishing…");
        try {
            await api.post(`/api/schedules/${id}/publish-now`, {});
            setNote("Publishing jobs queued — watch their status below.");
            await load();
        }
        catch {
            setNote("Publish failed.");
        }
    }
    return (_jsxs(_Fragment, { children: [_jsx("h2", { children: "Content calendar" }), _jsx("p", { className: "muted", children: "Scheduled posts, drafts, campaigns, and publishing status." }), note && _jsx("p", { className: "muted", children: note }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "New schedule" }), _jsxs("label", { children: ["Project", _jsxs("select", { value: projectId, onChange: (e) => setProjectId(e.target.value), children: [_jsx("option", { value: "", children: "\u2014 pick a draft \u2014" }), projects.map((p) => (_jsx("option", { value: p.id, children: p.title }, p.id)))] })] }), _jsx("br", {}), _jsx("br", {}), _jsxs("label", { children: ["Date and time", _jsx("input", { type: "datetime-local", value: when, onChange: (e) => setWhen(e.target.value) })] }), _jsx("p", { children: "Platforms" }), _jsx("div", { className: "row", children: PLATFORMS.map((p) => (_jsxs("label", { style: { fontSize: 14 }, children: [_jsx("input", { type: "checkbox", checked: picked.includes(p), onChange: () => toggle(p) }), " ", p] }, p))) }), _jsx("div", { className: "row", children: _jsx("button", { className: "btn btn-hero", onClick: createSchedule, children: "Schedule post" }) })] }), _jsx("div", { className: "grid", children: items.map((s) => (_jsxs("div", { className: "card", children: [_jsx("h3", { children: s.project_title || "Untitled project" }), _jsxs("p", { children: [new Date(s.scheduled_at).toLocaleString(), " \u00B7 ", s.status] }), _jsx("p", { children: JSON.parse(s.platforms || "[]").join(" · ") }), _jsx("div", { className: "row", children: _jsx("button", { className: "btn btn-dark", onClick: () => publishNow(s.id), children: "Publish now" }) })] }, s.id))) }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Publishing jobs" }), jobs.length === 0 && _jsx("p", { children: "No jobs yet." }), jobs.map((j) => (_jsxs("p", { children: [j.platform, ": ", _jsx("strong", { children: j.status }), j.last_error ? ` — ${j.last_error}` : ""] }, j.id))), _jsx("div", { className: "row", children: _jsx("button", { className: "btn", onClick: load, children: "Refresh" }) })] })] }));
}
//# sourceMappingURL=Planner.js.map