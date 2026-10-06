import type { Section } from "../lib/sections";

export default function Inspire({ go }: { go: (s: Section) => void }) {
  return (
    <>
      <h2>Content inspiration</h2>
      <p className="muted">Ideas generated from trends and your past performance.</p>
      <div className="grid">
        <div className="card">
          <h3>Teaser countdown</h3>
          <p>Three short clips building up to Friday's drop.</p>
          <button className="btn btn-dark" onClick={() => go("Create")}>
            Create This
          </button>
        </div>
        <div className="card">
          <h3>Hook test</h3>
          <p>"Nobody tells you this before starting a business…"</p>
          <button className="btn btn-dark" onClick={() => go("Create")}>
            Create This
          </button>
        </div>
        <div className="card">
          <h3>Customer story</h3>
          <p>Turn your best comment into a quote graphic.</p>
          <button className="btn btn-dark" onClick={() => go("Create")}>
            Create This
          </button>
        </div>
      </div>
    </>
  );
}
