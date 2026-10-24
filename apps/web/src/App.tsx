import { Suspense, lazy, useEffect, useState } from "react";
import type { ComponentType } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Notifications from "./components/Notifications";
import Onboarding from "./components/Onboarding";
import InstallBanner from "./components/InstallBanner";
import { Avatar, Icon, Logo, ToastProvider } from "./components/ui";
import { SECTIONS, SECTION_ICON } from "./lib/sections";
import type { Section } from "./lib/sections";
import { applyTheme, getTheme } from "./lib/theme";
import { api, wakeServer } from "./lib/api";
import { signOut, useSession } from "./auth/auth-client";
import "./styles.css";

// Each page loads when it is first opened, so the first screen appears faster.
const PAGES: Record<Section, ComponentType<{ go: (s: Section) => void }>> = {
  Home: lazy(() => import("./pages/Home")),
  Create: lazy(() => import("./pages/Create")),
  Trends: lazy(() => import("./pages/Trends")),
  Inspire: lazy(() => import("./pages/Inspire")),
  Planner: lazy(() => import("./pages/Planner")),
  Analytics: lazy(() => import("./pages/Analytics")),
  Assistant: lazy(() => import("./pages/Assistant")),
  Profile: lazy(() => import("./pages/Profile")),
};
type AuthView = "signin" | "signup" | null;

export default function App() {
  const [section, setSection] = useState<Section>("Home");
  const [authView, setAuthView] = useState<AuthView>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [bell, setBell] = useState(0);
  const [dark, setDark] = useState(() => (getTheme() === "dark") || (getTheme() === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches));
  const { data: session, isPending } = useSession();
  const userId = session?.user.id;

  useEffect(() => { applyTheme(getTheme()); wakeServer(); }, []);
  useEffect(() => {
    const h = (e: Event) => setAuthView((e as CustomEvent<"signin" | "signup">).detail);
    window.addEventListener("ol-auth", h);
    return () => window.removeEventListener("ol-auth", h);
  }, []);

  useEffect(() => {
    if (!userId) { setNeedsOnboarding(false); return; }
    api.get("/api/prefs").then((p: { onboarded: boolean }) => setNeedsOnboarding(!p.onboarded)).catch(() => {});
  }, [userId]);

  function openSection(s: Section) {
    setSection(s);
    setAuthView(null);
    window.scrollTo?.({ top: 0 });
  }
  function toggleTheme() {
    const next = dark ? "light" : "dark";
    applyTheme(next);
    setDark(!dark);
  }

  const Page = PAGES[section];
  return (
    <ToastProvider>
      <InstallBanner />
      <div className="app">
        <aside className="sidebar" aria-label="Main">
          <div className="brand"><Logo size={32} /><div>One Link<small>Create once. Reach everywhere.</small></div></div>
          {SECTIONS.map((s) => (
            <button key={s} className={s === section && !authView ? "nav-item active" : "nav-item"} aria-current={s === section && !authView ? "page" : undefined} onClick={() => openSection(s)}>
              <Icon name={SECTION_ICON[s]} />{s}
            </button>
          ))}
          <div className="side-foot">
            {isPending ? (
              <span className="who">Checking your session…</span>
            ) : session ? (
              <>
                <button className="me" onClick={() => openSection("Profile")} aria-label="Open your profile">
                  <Avatar name={session.user.name} email={session.user.email} src={session.user.image} size={36} />
                  <span className="me-text"><strong>{session.user.name || session.user.email.split("@")[0]}</strong><small>{session.user.email}</small></span>
                </button>
                <button className="nav-item" onClick={async () => { await signOut(); openSection("Home"); }}>Sign out</button>
              </>
            ) : (
              <>
                <button className={authView === "signin" ? "nav-item active" : "nav-item"} onClick={() => setAuthView("signin")}>Sign in</button>
                <button className={authView === "signup" ? "nav-item active" : "nav-item"} onClick={() => setAuthView("signup")}>Create account</button>
              </>
            )}
          </div>
        </aside>
        <div className="main-wrap">
          <div className="topbar">
            <span className="brand mobile-only" style={{ margin: 0, color: "var(--ink)" }}><Logo size={28} /></span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="icon-btn" onClick={toggleTheme} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}><Icon name={dark ? "sun" : "moon"} /></button>
              {session && <Notifications go={openSection} refreshKey={bell} />}
              {session && <button className="icon-btn me-top" onClick={() => openSection("Profile")} aria-label="Your profile"><Avatar name={session.user.name} email={session.user.email} src={session.user.image} size={32} /></button>}
              {!session && !isPending && <button className="btn btn-dark btn-sm" onClick={() => setAuthView("signin")}>Sign in</button>}
            </div>
          </div>
          <main className="main" id="main">
            {authView === "signin" && <Login onDone={() => { setBell((b) => b + 1); openSection("Home"); }} onSwitch={() => setAuthView("signup")} />}
            {authView === "signup" && <Signup onDone={() => openSection("Home")} onSwitch={() => setAuthView("signin")} />}
            {!authView && (
              <Suspense fallback={<div className="page-loading" role="status">Loading…</div>}>
                <Page key={section} go={openSection} />
              </Suspense>
            )}
          </main>
        </div>
        <nav className="tabbar" aria-label="Main">
          {SECTIONS.map((s) => (
            <button key={s} className={s === section && !authView ? "active" : ""} aria-current={s === section && !authView ? "page" : undefined} onClick={() => openSection(s)}>
              <Icon name={SECTION_ICON[s]} size={22} />{s}
            </button>
          ))}
        </nav>
        {session && needsOnboarding && <Onboarding onDone={() => { setNeedsOnboarding(false); setBell((b) => b + 1); }} />}
      </div>
    </ToastProvider>
  );
}
