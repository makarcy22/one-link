import { useState } from "react";
import { api } from "../lib/api";

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
    } catch {
      setMessages((m) => [...m, "The API is unreachable — is the server running?"]);
    }
    setBusy(false);
  }

  return (
    <>
      <h2>AI social assistant</h2>
      <p className="muted">Your consultant for ideas, trends, captions, timing, and strategy.</p>
      {messages.map((m, i) => (
        <div className="bubble" key={i}>
          {m}
        </div>
      ))}
      <div className="row">
        <input
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
