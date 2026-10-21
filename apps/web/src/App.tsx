import { lazy, Suspense, useEffect, useState } from "react";
import type { ComponentType } from "react";
import { SECTIONS } from "./lib/sections";
import type { Section } from "./lib/sections";
import { signOut, useSession } from "./auth/auth-client";
import "./styles.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const PAGES = {
  Home: lazy(() => import("./pages/Home")),
  Create: lazy(() => import("./pages/Create")),
  Trends: lazy(() => import("./pages/Trends")),
  Inspire: lazy(() => import("./pages/Inspire")),
  Planner: lazy(() => import("./pages/Planner")),
  Analytics: lazy(() => import("./pages/Analytics")),
  Assistant: lazy(() => import("./pages/Assistant")),
  Profile: lazy(() => import("./pages/Profile")),
} satisfies Record<Section, ComponentType<{ go: (s: Section) => void }>>;

type AuthView = "signin" | "signup" | null;

export default function App() {
  const [section, setSection] = useState<Section>("Home");
  const [authView, setAuthView] = useState<AuthView>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { data: session, isPending } = useSession();

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function openSection(s: Section) {
    setSection(s);
    setAuthView(null);
  }

  const Page = PAGES[section];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          one link <span>/</span> studio
        </div>
        {SECTIONS.map((s) => (
          <button
            key={s}
            className={s === section && !authView ? "nav-item active" : "nav-item"}
            onClick={() => openSection(s)}
          >
            {s}
          </button>
        ))}
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          {installPrompt && (
            <button className="nav-item" onClick={installApp}>
              Install app
            </button>
          )}
          {isPending ? (
            <p style={{ color: "#cbd5e1", fontSize: 13 }}>Checking session…</p>
          ) : session ? (
            <>
              <p style={{ color: "#cbd5e1", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>
                {session.user.email}
              </p>
              <button
                className="nav-item"
                onClick={async () => {
                  await signOut();
                  openSection("Home");
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                className={authView === "signin" ? "nav-item active" : "nav-item"}
                onClick={() => setAuthView("signin")}
              >
                Sign in
              </button>
              <button
                className={authView === "signup" ? "nav-item active" : "nav-item"}
                onClick={() => setAuthView("signup")}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </aside>

      <main className="main">
        {authView === "signin" && <Login onDone={() => openSection("Home")} />}
        {authView === "signup" && <Signup onDone={() => openSection("Home")} />}
        {!authView && (
          <Suspense fallback={<div className="page-loading">Loading…</div>}>
            <Page go={openSection} />
          </Suspense>
        )}
      </main>

      <nav className="tabbar">
        {SECTIONS.map((s) => (
          <button
            key={s}
            className={s === section && !authView ? "active" : ""}
            onClick={() => openSection(s)}
          >
            {s}
          </button>
        ))}
      </nav>
    </div>
  );
}
