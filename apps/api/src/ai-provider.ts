// Real AI provider: Groq (OpenAI-compatible chat API).
// Active only when GROQ_API_KEY is set; otherwise callers use templates.

const BASE = "https://api.groq.com/openai/v1";

export interface ChatResult {
  text: string;
  inTokens: number;
  outTokens: number;
  model: string;
}

export function groqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export function groqModel(): string {
  return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
}

export async function groqChat(
  system: string,
  user: string,
  maxTokens = 500
): Promise<ChatResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not configured.");
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: groqModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.8,
      max_tokens: maxTokens,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(body.error?.message || `Groq request failed (${res.status})`);
  }
  return {
    text: String(body.choices?.[0]?.message?.content ?? "").trim(),
    inTokens: body.usage?.prompt_tokens ?? 0,
    outTokens: body.usage?.completion_tokens ?? 0,
    model: groqModel(),
  };
}
