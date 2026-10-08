import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
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
import { signOut, useSession } from "./auth/auth-client";
import "./styles.css";
const PAGES = {
    Home,
    Create,
    Trends,
    Inspire,
    Planner,
    Analytics,
    Assistant,
    Profile,
};
export default function App() {
    const [section, setSection] = useState("Home");
    const [authView, setAuthView] = useState(null);
    const { data: session, isPending } = useSession();
    function openSection(s) {
        setSection(s);
        setAuthView(null);
    }
    const Page = PAGES[section];
    return (_jsxs("div", { className: "app", children: [_jsxs("aside", { className: "sidebar", children: [_jsxs("div", { className: "brand", children: ["one link ", _jsx("span", { children: "/" }), " studio"] }), SECTIONS.map((s) => (_jsx("button", { className: s === section && !authView ? "nav-item active" : "nav-item", onClick: () => openSection(s), children: s }, s))), _jsx("div", { style: { marginTop: "auto", paddingTop: 12 }, children: isPending ? (_jsx("p", { style: { color: "#cbd5e1", fontSize: 13 }, children: "Checking session\u2026" })) : session ? (_jsxs(_Fragment, { children: [_jsx("p", { style: { color: "#cbd5e1", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }, children: session.user.email }), _jsx("button", { className: "nav-item", onClick: async () => {
                                        await signOut();
                                        openSection("Home");
                                    }, children: "Sign out" })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { className: authView === "signin" ? "nav-item active" : "nav-item", onClick: () => setAuthView("signin"), children: "Sign in" }), _jsx("button", { className: authView === "signup" ? "nav-item active" : "nav-item", onClick: () => setAuthView("signup"), children: "Sign up" })] })) })] }), _jsxs("main", { className: "main", children: [authView === "signin" && _jsx(Login, { onDone: () => openSection("Home") }), authView === "signup" && _jsx(Signup, { onDone: () => openSection("Home") }), !authView && _jsx(Page, { go: openSection })] }), _jsx("nav", { className: "tabbar", children: SECTIONS.map((s) => (_jsx("button", { className: s === section && !authView ? "active" : "", onClick: () => openSection(s), children: s }, s))) })] }));
}
//# sourceMappingURL=App.js.map