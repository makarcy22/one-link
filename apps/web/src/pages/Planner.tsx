import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Section } from "../lib/sections";

interface Schedule {
  id: string;
  project_title: string | null;
  project_id: string | null;
  platforms: string;
  scheduled_at: string;
  status: string;
}

interface Project {
  id: string;
  title: string;
}

interface Job {
  id: string;
  platform: string;
  status: string;
  last_error: string;
}

const PLATFORMS = ["tiktok", "instagram", "facebook", "linkedin", "whatsapp"];

export default function Planner({ go }: { go: (s: Section) => void }) {
  void go;
  const [items, setItems] = useState<Schedule[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [note, setNote] = useState("Loading…");
  const [projectId, setProjectId] = useState("");
  const [when, setWhen] = useState("");
  const [picked, setPicked] = useState<string[]>(["tiktok"]);

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
      if (p[0] && !projectId) setProjectId(p[0].id);
      setNote("");
    } catch {
      setNote("Could not reach the API — is it running and are you signed in?");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(p: string) {
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
    } catch {
      setNote("Scheduling failed.");
    }
  }

  async function publishNow(id: string) {
    setNote("Publishing…");
    try {
      await api.post(`/api/schedules/${id}/publish-now`, {});
      setNote("Publishing jobs queued — watch their status below.");
      await load();
    } catch {
      setNote("Publish failed.");
    }
  }

  return (
    <>
      <h2>Content calendar</h2>
      <p className="muted">Scheduled posts, drafts, campaigns, and publishing status.</p>
      {note && <p className="muted">{note}</p>}

      <div className="card">
        <h3>New schedule</h3>
        <label>
          Project
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">— pick a draft —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <br />
        <br />
        <label>
          Date and time
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </label>
        <p>Platforms</p>
        <div className="row">
          {PLATFORMS.map((p) => (
            <label key={p} style={{ fontSize: 14 }}>
              <input type="checkbox" checked={picked.includes(p)} onChange={() => toggle(p)} /> {p}
            </label>
          ))}
        </div>
        <div className="row">
          <button className="btn btn-hero" onClick={createSchedule}>
            Schedule post
          </button>
        </div>
      </div>

      <div className="grid">
        {items.map((s) => (
          <div className="card" key={s.id}>
            <h3>{s.project_title || "Untitled project"}</h3>
            <p>
              {new Date(s.scheduled_at).toLocaleString()} · {s.status}
            </p>
            <p>{JSON.parse(s.platforms || "[]").join(" · ")}</p>
            <div className="row">
              <button className="btn btn-dark" onClick={() => publishNow(s.id)}>
                Publish now
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Publishing jobs</h3>
        {jobs.length === 0 && <p>No jobs yet.</p>}
        {jobs.map((j) => (
          <p key={j.id}>
            {j.platform}: <strong>{j.status}</strong>
            {j.last_error ? ` — ${j.last_error}` : ""}
          </p>
        ))}
        <div className="row">
          <button className="btn" onClick={load}>
            Refresh
          </button>
        </div>
      </div>
    </>
  );
}
