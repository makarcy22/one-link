import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { api } from "../lib/api";
export default function Assistant({ go }) {
    void go;
    const [messages, setMessages] = useState([
        "Ask me about ideas, trends, captions, hashtags, timing, or performance.",
    ]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    async function ask() {
        const question = input.trim();
        if (!question || busy)
            return;
        setInput("");
        setBusy(true);
        setMessages((m) => [...m, question]);
        try {
            const res = await api.post("/api/ai/ask", { question });
            setMessages((m) => [...m, res.answer]);
        }
        catch {
            setMessages((m) => [...m, "The API is unreachable — is the server running?"]);
        }
        setBusy(false);
    }
    return (_jsxs(_Fragment, { children: [_jsx("h2", { children: "AI social assistant" }), _jsx("p", { className: "muted", children: "Your consultant for ideas, trends, captions, timing, and strategy." }), messages.map((m, i) => (_jsx("div", { className: "bubble", children: m }, i))), _jsxs("div", { className: "row", children: [_jsx("input", { value: input, onChange: (e) => setInput(e.target.value), placeholder: "What should I post today?", onKeyDown: (e) => e.key === "Enter" && ask() }), _jsx("button", { className: "btn btn-dark", onClick: ask, disabled: busy, children: busy ? "Thinking…" : "Ask" })] })] }));
}
//# sourceMappingURL=Assistant.js.map