import { useState } from "react";
import { api, errorText } from "../lib/api";
import { PageHead } from "../components/ui";

import type { Section } from "../lib/sections";

export default function Assistant({ go }: { go: (s: Section) => void }) {
  void go;
  const [messages, setMessages] = useState<string[]>([
    "Ask me about ideas, trends, captions, hashtags, timing, or performance.",
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask() {
    const question = input.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, question]);
    try {
      const res = await api.post("/api/ai/ask", { question });
      setMessages((m) => [...m, res.answer]);
    } catch (e) {
      setMessages((m) => [...m, errorText(e)]);
    }
    setBusy(false);
  }

  return (
    <>
      <PageHead title="Assistant" sub="Ask for ideas, captions, timing or a plan. It knows your topic." />
      {messages.map((m, i) => (
        <div className="bubble" key={i}>
          {m}
        </div>
      ))}
      <div className="row">
        <input
          aria-label="Your question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What should I post today?"
          onKeyDown={(e) => e.key === "Enter" && ask()}
        />
        <button className="btn btn-dark" onClick={ask} disabled={busy}>
          {busy ? "Thinking…" : "Ask"}
        </button>
      </div>
    </>
  );
}
