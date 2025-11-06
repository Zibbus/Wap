import { Router } from "express";
import rateLimit from "express-rate-limit";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const router = Router();

// Limite base: 30 richieste/min/IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// ---- Config da .env ----
const PROVIDER = (process.env.PROVIDER || "ollama").toLowerCase();
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Normalizza i messaggi (filtra ruoli non validi)
function sanitizeMessages(msgs: Msg[]): Msg[] {
  const allowed = new Set(["user", "assistant", "system"]);
  return (msgs || [])
    .filter(m => m && allowed.has(m.role) && typeof m.content === "string")
    .map(m => ({ role: m.role, content: m.content }));
}

// ---- Provider: OLLAMA ----
async function chatWithOllama(messages: Msg[]): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // stream:false → risposta compatta in un colpo solo
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      options: {
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama HTTP ${res.status}: ${text}`);
  }

  // Formato risposta Ollama (chat non‐stream): { message: { role, content }, ... }
  const data = await res.json();
  const reply = data?.message?.content ?? "";
  return reply.trim();
}

// ---- Provider: OPENAI (opzionale) ----
async function chatWithOpenAI(messages: Msg[]): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY mancante.");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content ?? "";
  return reply.trim();
}

// ---- Rotte ----
router.get("/ping", (_req, res) => {
  res.json({ ok: true, provider: PROVIDER });
});

router.post("/chat", limiter, /* requireAuth, */ async (req, res) => {
  try {
    const body = (req as any).body || {};
    const messages = sanitizeMessages(body.messages || []);
    if (!messages.length) {
      return res.status(400).json({ error: "messages vuoto" });
    }

    let reply = "";
    if (PROVIDER === "ollama") {
      reply = await chatWithOllama(messages);
    } else if (PROVIDER === "openai") {
      reply = await chatWithOpenAI(messages);
    } else {
      return res.status(400).json({ error: `PROVIDER non supportato: ${PROVIDER}` });
    }

    if (!reply) {
      reply = "Al momento non ho una risposta disponibile, riprova tra poco.";
    }

    res.json({ reply });
  } catch (err: any) {
    console.error("assistant/chat error:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
