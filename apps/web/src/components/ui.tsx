import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState } from "react";
import { initials } from "../lib/avatar";

const P = {
  home: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  create: "M12 5v14M5 12h14",
  trends: "M3 17l6-6 4 4 8-9M15 6h6v6",
  inspire: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z",
  planner: "M5 5h14v15H5zM5 10h14M9 3v4M15 3v4",
  analytics: "M5 20V10M12 20V4M19 20v-7",
  assistant: "M4 5h16v11H9l-5 4z",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  bell: "M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6 6 18",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  alert: "M12 4 2.5 20h19zM12 10v4M12 17v.5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  arrow: "M5 12h14M13 6l6 6-6 6",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
  copy: "M9 9h11v11H9zM5 15V4h11",
  save: "M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
} as const;
export type IconName = keyof typeof P;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={P[name]} />
    </svg>
  );
}

/** The One Link mark: two linked rings. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--orange)" />
      <circle cx="12.5" cy="16" r="6" fill="none" stroke="#111" strokeWidth="2.6" />
      <circle cx="19.5" cy="16" r="6" fill="none" stroke="#111" strokeWidth="2.6" opacity=".55" />
    </svg>
  );
}

export const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877f2",
  instagram: "#d6249f",
  tiktok: "#111111",
  linkedin: "#0a66c2",
  x: "#111111",
  whatsapp: "#128c4a",
};
export function PlatformDot({ platform }: { platform: string }) {
  return <span className="pdot" style={{ background: PLATFORM_COLORS[platform] ?? "var(--muted)" }} aria-hidden="true" />;
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    scheduled: ["Scheduled", "info"],
    queued: ["Waiting", "info"],
    running: ["Posting", "info"],
    publishing: ["Posting", "info"],
    completed: ["Posted", "good"],
    failed: ["Needs attention", "bad"],
    manual: ["Post it yourself", "warn"],
    past_due: ["Payment due", "warn"],
    connected: ["Connected", "good"],
    expired: ["Reconnect", "warn"],
  };
  const [label, tone] = map[status] ?? [status, "info"];
  return <span className={`pill pill-${tone}`}>{label}</span>;
}

type Toast = { id: number; text: string; tone: "ok" | "bad" };
const ToastCtx = createContext<(text: string, tone?: "ok" | "bad") => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: "ok" | "bad" = "ok") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, text, tone }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <Icon name={t.tone === "ok" ? "check" : "alert"} size={18} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}

/** A person's picture, or their initials on orange when they have no picture yet. */
export function Avatar({ name, email, src, size = 36 }: { name?: string | null; email?: string; src?: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  return src ? (
    <img className="avatar" src={src} alt="" style={style} />
  ) : (
    <span className="avatar avatar-initials" style={style} aria-hidden="true">{initials(name, email)}</span>
  );
}
