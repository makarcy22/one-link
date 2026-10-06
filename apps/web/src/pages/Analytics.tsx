import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Summary {
  by_platform: { platform: string; views: number; engagement: number }[];
  totals: { views: number; reach: number; likes: number; comments: number; shares: number; saves: number };
  coach: string;
}

import type { Section } from "../lib/sections";

export default function Analytics({ go }: { go: (s: Section) => void }) {
  void go;
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    api
      .get("/api/analytics/summary")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <>
        <h2>Performance</h2>
        <p className="muted">Connect the API and publish your first post to unlock analytics.</p>
      </>
    );
  }

  return (
    <>
      <h2>Performance</h2>
      <p className="muted">Cross-platform totals.</p>
      <div className="grid">
        <div className="card">
          <h3>Views</h3>
          <p className="stat">{data.totals.views.toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Reach</h3>
          <p className="stat">{data.totals.reach.toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Engagement</h3>
          <p className="stat">
            {data.totals.likes + data.totals.comments + data.totals.shares + data.totals.saves}
          </p>
        </div>
      </div>
      <div className="card">
        <h3>Coach</h3>
        <p>{data.coach}</p>
        {data.by_platform.map((p) => (
          <p key={p.platform}>
            {p.platform}: {p.views.toLocaleString()} views
          </p>
        ))}
      </div>
    </>
  );
}
