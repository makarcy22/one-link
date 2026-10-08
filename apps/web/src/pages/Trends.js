import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
const FALLBACK = [
    { topic: "New drop teasers", category: "Fashion", platform: "tiktok", heat: "hot", hashtags: ["#NewDrop"] },
    { topic: "Behind the scenes", category: "Business", platform: "instagram", heat: "rising", hashtags: ["#BTS"] },
];
export default function Trends({ go }) {
    const [trends, setTrends] = useState(FALLBACK);
    const [platform, setPlatform] = useState("all");
    useEffect(() => {
        api
            .get(`/api/trends?platform=${platform}`)
            .then(setTrends)
            .catch(() => setTrends(FALLBACK));
    }, [platform]);
    return (_jsxs(_Fragment, { children: [_jsx("h2", { children: "Trending Center" }), _jsx("p", { className: "muted", children: "Filter: Global \u00B7 Your niche" }), _jsxs("label", { children: ["Platform", _jsx("select", { value: platform, onChange: (e) => setPlatform(e.target.value), children: ["all", "tiktok", "instagram", "facebook", "linkedin"].map((p) => (_jsx("option", { children: p }, p))) })] }), _jsx("br", {}), _jsx("br", {}), _jsx("div", { className: "grid", children: trends.map((t) => (_jsxs("div", { className: "card", children: [_jsx("h3", { children: t.topic }), _jsxs("p", { children: [t.category, " \u00B7 ", t.platform, " \u00B7 ", t.heat] }), t.hashtags.map((h) => (_jsx("span", { className: "chip", children: h }, h))), _jsx("div", { className: "row", children: _jsx("button", { className: "btn btn-dark", onClick: () => go("Create"), children: "Create This" }) })] }, t.topic))) })] }));
}
//# sourceMappingURL=Trends.js.map