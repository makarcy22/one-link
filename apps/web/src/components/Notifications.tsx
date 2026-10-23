import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { ago } from "../lib/format";
import { SECTIONS, type Section } from "../lib/sections";
import { Icon } from "./ui";

interface Item { id: string; kind: string; title: string; body: string; link: string; read_at: string | null; created_at: string }

export default function Notifications({ go, refreshKey }: { go: (s: Section) => void; refreshKey: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/api/notifications");
      setItems(r.items);
      setUnread(r.unread);
    } catch {
      /* the bell just stays quiet when the server is away */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load, refreshKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  async function openItem(n: Item) {
    await api.post("/api/notifications/read", { id: n.id }).catch(() => {});
    setOpen(false);
    if ((SECTIONS as readonly string[]).includes(n.link)) go(n.link as Section);
    load();
  }

  return (
    <div ref={box}>
      <button className="icon-btn" aria-label={`Notifications${unread ? `, ${unread} new` : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="bell" />
        {unread > 0 && <span className="badge">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="panel" role="dialog" aria-label="Notifications">
          <div className="panel-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button className="btn btn-sm btn-quiet" onClick={async () => { await api.post("/api/notifications/read", {}); load(); }}>
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 && <p className="muted" style={{ padding: 16 }}>Nothing yet. We tell you here when a post goes out, needs your help, or is due.</p>}
          {items.map((n) => (
            <button key={n.id} className={`note${n.read_at ? "" : " unread"}`} onClick={() => openItem(n)}>
              <b>{n.title}</b>
              {n.body && <div className="muted small clip">{n.body}</div>}
              <div className="muted small">{ago(n.created_at)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
