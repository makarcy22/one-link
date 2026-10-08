import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
export default function Analytics({ go }) {
    void go;
    const [data, setData] = useState(null);
    useEffect(() => {
        api
            .get("/api/analytics/summary")
            .then(setData)
            .catch(() => setData(null));
    }, []);
    if (!data) {
        return (_jsxs(_Fragment, { children: [_jsx("h2", { children: "Performance" }), _jsx("p", { className: "muted", children: "Connect the API and publish your first post to unlock analytics." })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("h2", { children: "Performance" }), _jsx("p", { className: "muted", children: "Cross-platform totals." }), _jsxs("div", { className: "grid", children: [_jsxs("div", { className: "card", children: [_jsx("h3", { children: "Views" }), _jsx("p", { className: "stat", children: data.totals.views.toLocaleString() })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Reach" }), _jsx("p", { className: "stat", children: data.totals.reach.toLocaleString() })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Engagement" }), _jsx("p", { className: "stat", children: data.totals.likes + data.totals.comments + data.totals.shares + data.totals.saves })] })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Coach" }), _jsx("p", { children: data.coach }), data.by_platform.map((p) => (_jsxs("p", { children: [p.platform, ": ", p.views.toLocaleString(), " views"] }, p.platform)))] })] }));
}
//# sourceMappingURL=Analytics.js.map