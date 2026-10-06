import { useState } from "react";
import type { ComponentType } from "react";
import Home from "./pages/Home";
import Create from "./pages/Create";
import Trends from "./pages/Trends";
import Inspire from "./pages/Inspire";
import Planner from "./pages/Planner";
import Analytics from "./pages/Analytics";
import Assistant from "./pages/Assistant";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { SECTIONS } from "./lib/sections";
import type { Section } from "./lib/sections";
import { signOut, useSession } from "./auth/auth-client";
import "./styles.css";

const PAGES: Record<Section, ComponentType<{ go: (s: Section) => void }>> = {
  Home,
  Create,
  Trends,
  Inspire,
  Planner,
  Analytics,
  Assistant,
  Profile,
};

type AuthView = "signin" | "signup" | null;

export default function App() {
  const [section, setSection] = useState<Section>("Home");
  const [authView, setAuthView] = useState<AuthView>(null);
  const { data: session, isPending } = useSession();

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
        {!authView && <Page go={openSection} />}
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
