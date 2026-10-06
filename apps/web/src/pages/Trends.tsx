import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Section } from "../lib/sections";

interface Trend {
  topic: string;
  category: string;
  platform: string;
  heat: string;
  hashtags: string[];
}

const FALLBACK: Trend[] = [
  { topic: "New drop teasers", category: "Fashion", platform: "tiktok", heat: "hot", hashtags: ["#NewDrop"] },
  { topic: "Behind the scenes", category: "Business", platform: "instagram", heat: "rising", hashtags: ["#BTS"] },
];

export default function Trends({ go }: { go: (s: Section) => void }) {
  const [trends, setTrends] = useState<Trend[]>(FALLBACK);
  const [platform, setPlatform] = useState("all");

  useEffect(() => {
    api
      .get(`/api/trends?platform=${platform}`)
      .then(setTrends)
      .catch(() => setTrends(FALLBACK));
  }, [platform]);

  return (
    <>
      <h2>Trending Center</h2>
      <p className="muted">Filter: Global · Your niche</p>
      <label>
        Platform
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          {["all", "tiktok", "instagram", "facebook", "linkedin"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <br />
      <br />
      <div className="grid">
        {trends.map((t) => (
          <div className="card" key={t.topic}>
            <h3>{t.topic}</h3>
            <p>
              {t.category} · {t.platform} · {t.heat}
            </p>
            {t.hashtags.map((h) => (
              <span className="chip" key={h}>
                {h}
              </span>
            ))}
            <div className="row">
              <button className="btn btn-dark" onClick={() => go("Create")}>
                Create This
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
