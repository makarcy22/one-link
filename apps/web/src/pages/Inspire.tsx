import { useState } from "react";
import { CAPTION_STARTERS, fillCaption } from "@one-link/shared";
import { setHandoff, type Section } from "../lib/sections";
import { PageHead } from "../components/ui";

export default function Inspire({ go }: { go: (s: Section) => void }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  return (
    <>
      <PageHead title="Inspire" sub="Caption starters for common posts. Fill in the blanks, then open it in the composer." />
      <div className="grid">
        {CAPTION_STARTERS.map((s) => (
          <article key={s.id} className="card" style={{ display: "grid", gap: 8, alignContent: "start" }}>
            <h3 style={{ margin: 0 }}>{s.name}</h3>
            <p className="preview-post" style={{ margin: 0 }}>{s.body.length > 90 ? s.body.slice(0, 90) + "…" : s.body}</p>
            {s.fields.map((f) => (
              <label key={f.key} className="field" htmlFor={`${s.id}-${f.key}`}>{f.label}
                <input id={`${s.id}-${f.key}`} value={vals[`${s.id}.${f.key}`] ?? ""} placeholder={f.placeholder} onChange={(e) => setVals({ ...vals, [`${s.id}.${f.key}`]: e.target.value })} />
              </label>
            ))}
            <div className="row" style={{ margin: 0 }}>
              <button className="btn btn-sm btn-dark" onClick={() => {
                const v: Record<string, string> = {};
                for (const f of s.fields) v[f.key] = vals[`${s.id}.${f.key}`] ?? "";
                setHandoff({ text: fillCaption(s, v) });
                go("Create");
              }}>Open in composer</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
