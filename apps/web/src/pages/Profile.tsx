import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { Section } from "../lib/sections";

interface Brand {
  id: string;
  name: string;
  description: string;
  website: string;
  voice: string;
}

const EMPTY: Brand = { id: "", name: "", description: "", website: "", voice: "Casual" };

export default function Profile({ go }: { go: (s: Section) => void }) {
  void go;
  const [brand, setBrand] = useState<Brand>(EMPTY);
  const [status, setStatus] = useState("Loading…");
  const [connectNote, setConnectNote] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get("/api/brands")
      .then((rows: Brand[]) => {
        if (rows[0]) setBrand(rows[0]);
        setStatus("");
      })
      .catch(() => setStatus("Could not reach the API — is it running?"));
  }, []);

  async function save() {
    setStatus("Saving…");
    try {
      const saved = brand.id
        ? await api.put(`/api/brands/${brand.id}`, brand)
        : await api.post("/api/brands", brand);
      setBrand(saved);
      setStatus("Saved.");
    } catch {
      setStatus("Save failed.");
    }
  }

  return (
    <>
      <h2>Brand profile</h2>
      <p className="muted">The AI uses this to keep content consistent.</p>
      {status && <p className="muted">{status}</p>}
      <label>
        Brand name
        <input
          ref={nameRef}
          value={brand.name}
          onChange={(e) => setBrand({ ...brand, name: e.target.value })}
        />
      </label>
      <br />
      <br />
      <label>
        Description
        <input value={brand.description} onChange={(e) => setBrand({ ...brand, description: e.target.value })} />
      </label>
      <br />
      <br />
      <label>
        Website
        <input value={brand.website} onChange={(e) => setBrand({ ...brand, website: e.target.value })} />
      </label>
      <br />
      <br />
      <label>
        Voice
        <select value={brand.voice} onChange={(e) => setBrand({ ...brand, voice: e.target.value })}>
          {["Casual", "Professional", "Funny", "Inspirational", "Promotional"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <div className="row">
        <button className="btn btn-dark" onClick={save}>
          Save profile
        </button>
        <button className="btn" onClick={() => nameRef.current?.focus()}>
          Edit name
        </button>
        <button
          className="btn"
          onClick={() =>
            setConnectNote(
              "Social connectors arrive in the review pass — your One Link login is the connected identity for now."
            )
          }
        >
          Connect account
        </button>
      </div>
      {connectNote && <p className="muted">{connectNote}</p>}
      <div className="grid">
        <div className="card">
          <h3>Connected accounts</h3>
          <p>TikTok · Instagram · Facebook · LinkedIn (connectors arrive in review pass).</p>
        </div>
        <div className="card">
          <h3>Saved assets</h3>
          <p>Captions, hashtag groups, templates.</p>
        </div>
      </div>
    </>
  );
}
