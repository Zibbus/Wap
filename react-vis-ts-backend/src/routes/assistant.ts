import { Router } from "express";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import db from "../db";
import requireAuth from "../middleware/requireAuth";

/* ------- Provider (Ollama di default) ------- */
const PROVIDER           = (process.env.PROVIDER || "ollama").toLowerCase();
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL       = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";
const OLLAMA_MODEL_LIGHT = process.env.OLLAMA_MODEL_LIGHT || "qwen2.5:1.5b-instruct";
const LOW_MEMORY         = String(process.env.LOW_MEMORY ?? "0") === "1";

const router = Router();

/** Trova l'ID utente del bot */
async function getBotUserId(): Promise<number> {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT CAST(v AS UNSIGNED) AS botId FROM app_settings WHERE k='BOT_USER_ID' LIMIT 1"
  );
  const id = Number(rows?.[0]?.botId || 0);
  if (!id) throw new Error("BOT_USER_ID non configurato in app_settings");
  return id;
}

/** Crea un nuovo thread bot↔utente (non usa chat_links) */
async function createAssistantThread(ownerId: number, title?: string, folderId?: number | null): Promise<number> {
  const botId = await getBotUserId();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [thr] = await conn.query<ResultSetHeader>(
      "INSERT INTO chat_threads (is_bot_thread, owner_user_id, title, folder_id) VALUES (1, ?, ?, ?)",
      [ownerId, title || "Nuova conversazione", folderId ?? null]
    );
    const threadId = thr.insertId;

    await conn.query(
      "INSERT INTO chat_participants (thread_id, user_id) VALUES (?, ?), (?, ?)",
      [threadId, ownerId, threadId, botId]
    );

    await conn.commit();
    return threadId;
  } catch (e) {
    try { await conn.rollback(); } catch {}
    throw e;
  } finally {
    conn.release();
  }
}

/** Verifica che il thread appartenga all'utente e sia di tipo bot */
async function assertOwnAssistantThread(userId: number, threadId: number): Promise<void> {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT 1 FROM chat_threads WHERE id=? AND is_bot_thread=1 AND owner_user_id=?",
    [threadId, userId]
  );
  if (!rows[0]) throw new Error("Thread non trovato o non tuo");
}

/** ----------------------- Config Bot / Decoding ----------------------- */
const BOT_SYSTEM_PROMPT =
  (process.env.BOT_SYSTEM_PROMPT || `
Sei MyFitBot, un assistente che risponde in ITALIANO naturale, chiaro e professionale.
- Frasi brevi, tono amichevole e preciso.
- Niente anglismi inutili, traduci termini tecnici quando possibile.
- Usa elenchi puntati quando migliorano la leggibilità.
- Se la domanda è ambigua, fai una sola domanda di chiarimento, breve.
- Quando fornisci codice, aggiungi un commento di 1-2 righe che spiega cosa fa.
`).trim();

const BOT_TEMPERATURE = Number(process.env.BOT_TEMPERATURE ?? 0.4);
const BOT_TOP_P       = Number(process.env.BOT_TOP_P ?? 0.9);
const BOT_REPEAT_PEN  = Number(process.env.BOT_REPEAT_PENALTY ?? 1.05);
const BOT_NUM_CTX     = Number(process.env.BOT_NUM_CTX ?? 4096);
const BOT_NUM_CTX_LIGHT = Number(process.env.BOT_NUM_CTX_LIGHT ?? 2048);

// (opzionale) rispondi nella lingua dell'ultimo utente?
const BOT_MATCH_USER_LANG = String(process.env.BOT_MATCH_USER_LANG ?? "true").toLowerCase() === "true";

/** Picker di modello e contesto */
function pickModel(requested?: string) {
  // priorità: modello esplicito nel body → LOW_MEMORY → default
  if (requested && typeof requested === "string" && requested.trim()) return requested.trim();
  return LOW_MEMORY ? OLLAMA_MODEL_LIGHT : OLLAMA_MODEL;
}
function pickCtx(modelUsed: string) {
  return (modelUsed === OLLAMA_MODEL_LIGHT) ? BOT_NUM_CTX_LIGHT : BOT_NUM_CTX;
}

// Utility minima per “indovinare” la lingua (grezza ma efficace per IT vs EN)
function detectLang(s: string): "it" | "en" | "other" {
  const t = (s || "").toLowerCase();
  const itHits = (t.match(/[àèéìòóù]/g)?.length || 0)
    + (t.match(/\b(perché|cioè|comunque|quindi|allora|ciao|grazie|figurati|prego|magari)\b/g)?.length || 0);
  const enHits = (t.match(/\b(please|thanks|hi|hello|however|therefore|anyway|maybe)\b/g)?.length || 0);
  if (itHits >= Math.max(1, enHits + 1)) return "it";
  if (enHits >= Math.max(1, itHits + 1)) return "en";
  return "other";
}

/** Chat non-stream con Ollama (migliorata + modello selezionabile) */
async function generateBotReply(
  history: Array<{role:"user"|"assistant", content: string}>,
  requestedModel?: string
): Promise<{ text: string; modelUsed: string }> {
  // costruisco il system prompt
  let sys = BOT_SYSTEM_PROMPT;

  // tenta di adattare la lingua all'ultimo utente
  if (BOT_MATCH_USER_LANG) {
    const lastUser = [...history].reverse().find(m => m.role === "user")?.content || "";
    const lang = detectLang(lastUser);
    if (lang === "en") {
      sys = sys + "\n\nIMPORTANT: answer in ENGLISH, succinct and friendly.";
    } else {
      // default italiano
      sys = sys + "\n\nIMPORTANTE: rispondi in ITALIANO naturale.";
    }
  }

  // messaggi: system + history
  const messages = [{ role: "system", content: sys }, ...history];

  // modello + ctx
  const modelUsed = pickModel(requestedModel);
  const numCtx    = pickCtx(modelUsed);

  const body = {
    model: modelUsed,
    stream: false,
    messages,
    options: {
      temperature: BOT_TEMPERATURE,
      top_p: BOT_TOP_P,
      repeat_penalty: BOT_REPEAT_PEN,
      num_ctx: numCtx,
    }
  };

  // ---- chiamata robusta a Ollama + log utili
  let json: any;
  try {
    const resp = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.error("[ollama /api/chat] HTTP", resp.status, txt);
      throw new Error(`Ollama /api/chat HTTP ${resp.status}`);
    }
    json = await resp.json();
  } catch (e: any) {
    console.error("[ollama /api/chat] errore:", e?.message || e);
    return { text: "Errore nel contattare il modello. Verifica che Ollama sia avviato e che il modello sia disponibile.", modelUsed };
  }

  const content = json?.message?.content || json?.messages?.at(-1)?.content || "Non ho una risposta.";
  return { text: String(content), modelUsed };
}

/** Titolo di fallback dal primo testo utente */
function fallbackTitleFrom(text: string) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return "Nuova conversazione";
  const sentence = t.split(/[.!?]\s/)[0] || t;
  let title = sentence.slice(0, 60);
  if (sentence.length > 60) title = title.replace(/\s+\S*$/, "") + "…";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/** Prova a far generare il titolo al modello (con picker) */
async function askModelForTitle(promptText: string, requestedModel?: string): Promise<string | null> {
  try {
    if (PROVIDER !== "ollama") return null;
    const modelUsed = pickModel(requestedModel);
    const resp = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelUsed,
        prompt:
`Sei un assistente. Genera un titolo breve (max 7 parole), chiaro e descrittivo in italiano per questa conversazione.
Niente virgolette, niente emoji, niente punto finale.
Testo utente:
"${promptText}"`,
        stream: false,
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.error("[ollama /api/generate] HTTP", resp.status, txt);
      return null;
    }
    const json = await resp.json();
    const out = (json?.response || "").trim();
    if (!out) return null;
    return out.replace(/^["“”]+|["“”]+$/g, "").replace(/[.?!]\s*$/,"");
  } catch (e: any) {
    console.error("[askModelForTitle] errore:", e?.message || e);
    return null;
  }
}

/* ------------------------ FOLDERS ------------------------ */

router.get("/folders", requireAuth, async (req: any, res) => {
  const me = Number(req.user.id);
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, name, created_at AS createdAt FROM assistant_folders WHERE user_id=? ORDER BY name ASC",
    [me]
  );
  res.json(rows);
});

router.post("/folders", requireAuth, async (req: any, res) => {
  const me = Number(req.user.id);
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Nome cartella obbligatorio" });

  const [ins] = await db.query<ResultSetHeader>(
    "INSERT INTO assistant_folders (user_id, name) VALUES (?, ?)",
    [me, name]
  );
  res.status(201).json({ id: ins.insertId, name });
});

router.patch("/folders/:id", requireAuth, async (req: any, res) => {
  const me = Number(req.user.id);
  const id = Number(req.params.id);
  const name = String(req.body?.name || "").trim();
  if (!id || !name) return res.status(400).json({ error: "Dati non validi" });

  const [own] = await db.query<RowDataPacket[]>(
    "SELECT 1 FROM assistant_folders WHERE id=? AND user_id=?",
    [id, me]
  );
  if (!own[0]) return res.status(404).json({ error: "Cartella non trovata" });

  await db.query<ResultSetHeader>("UPDATE assistant_folders SET name=? WHERE id=?", [name, id]);
  res.json({ ok: true });
});

router.delete("/folders/:id", requireAuth, async (req: any, res) => {
  const me = Number(req.user.id);
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID non valido" });

  const [own] = await db.query<RowDataPacket[]>(
    "SELECT 1 FROM assistant_folders WHERE id=? AND user_id=?",
    [id, me]
  );
  if (!own[0]) return res.status(404).json({ error: "Cartella non trovata" });

  const [used] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM chat_threads WHERE is_bot_thread=1 AND owner_user_id=? AND folder_id=?",
    [me, id]
  );
  if (Number(used?.[0]?.n || 0) > 0) {
    return res.status(409).json({ error: "Cartella non vuota" });
  }

  await db.query<ResultSetHeader>("DELETE FROM assistant_folders WHERE id=?", [id]);
  res.json({ ok: true });
});

/* ------------------------ THREADS ------------------------ */

/** GET /api/assistant/threads?search=&folderId= */
router.get("/threads", requireAuth, async (req: any, res) => {
  const me = Number(req.user.id);
  const search  = String(req.query?.search || "").trim().toLowerCase();
  const folderId = req.query?.folderId ? Number(req.query.folderId) : null;

  const params: any[] = [me, me];

  let where = "t.is_bot_thread=1 AND t.owner_user_id=?";
  if (folderId) {
    where += " AND t.folder_id=?";
    params.push(folderId);
  }
  if (search) {
    where += " AND (LOWER(t.title) LIKE ? OR LOWER(pm.body) LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like);
  }

  const sql = `
    SELECT
      t.id          AS threadId,
      t.title       AS title,
      t.folder_id   AS folderId,
      pm.body       AS lastBody,
      pm.created_at AS lastAt,
      COUNT(m.id)   AS unread
    FROM chat_threads t
    JOIN chat_participants cpMe
      ON cpMe.thread_id = t.id AND cpMe.user_id = ?
    LEFT JOIN (
      SELECT m1.thread_id, m1.body, m1.created_at
      FROM chat_messages m1
      JOIN (
        SELECT thread_id, MAX(id) AS max_id
        FROM chat_messages
        GROUP BY thread_id
      ) last ON last.thread_id = m1.thread_id AND last.max_id = m1.id
    ) pm ON pm.thread_id = t.id
    LEFT JOIN chat_messages m
      ON m.thread_id = t.id
     AND m.id > COALESCE(cpMe.last_read_message_id, 0)
     AND m.sender_id <> cpMe.user_id
    WHERE ${where}
    GROUP BY t.id, t.title, t.folder_id, pm.body, pm.created_at
    ORDER BY (pm.created_at IS NULL) ASC, pm.created_at DESC, t.id DESC
  `;

  try {
    const [rows] = await db.query<RowDataPacket[]>(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("[assistant/threads] SQL error:", err);
    res.status(500).json({ error: "Errore nel caricamento dei thread" });
  }
});

/** POST /api/assistant/threads { title?, folderId? } */
router.post("/threads", requireAuth, async (req: any, res) => {
  const me = Number(req.user.id);
  const title = String(req.body?.title || "").trim() || "Nuova conversazione";
  const folderId = req.body?.folderId ? Number(req.body.folderId) : null;

  if (folderId) {
    const [own] = await db.query<RowDataPacket[]>(
      "SELECT 1 FROM assistant_folders WHERE id=? AND user_id=?",
      [folderId, me]
    );
    if (!own[0]) return res.status(400).json({ error: "Cartella non valida" });
  }

  const threadId = await createAssistantThread(me, title, folderId);
  res.status(201).json({ threadId, title, folderId });
});

/** GET /api/assistant/thread/:id  → messaggi (+ botUserId) */
router.get("/thread/:id", requireAuth, async (req: any, res) => {
  const me = Number(req.user.id);
  const threadId = Number(req.params.id) || 0;
  if (!threadId) return res.status(400).json({ error: "threadId non valido" });

  try {
    await assertOwnAssistantThread(me, threadId);
  } catch {
    return res.status(404).json({ error: "Thread inesistente" });
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      m.id,
      m.sender_id AS senderId,
      m.body,
      m.created_at AS createdAt
    FROM chat_messages m
    WHERE m.thread_id=?
    ORDER BY m.id ASC
    `,
    [threadId]
  );

  const botUserId = await getBotUserId();
  res.json({ threadId, messages: rows, botUserId });
});

/** PATCH /api/assistant/thread/:id  { title?, folderId? } */
router.patch("/thread/:id", requireAuth, async (req: any, res) => {
  const me = Number(req.user.id);
  const threadId = Number(req.params.id) || 0;
  const title = typeof req.body?.title === "string" ? String(req.body.title).trim() : undefined;
  const folderId = req.body?.folderId !== undefined ? (req.body.folderId === null ? null : Number(req.body.folderId)) : undefined;

  if (!threadId) return res.status(400).json({ error: "threadId non valido" });

  try {
    await assertOwnAssistantThread(me, threadId);
  } catch {
    return res.status(404).json({ error: "Thread inesistente" });
  }

  if (folderId !== undefined && folderId !== null) {
    const [own] = await db.query<RowDataPacket[]>(
      "SELECT 1 FROM assistant_folders WHERE id=? AND user_id=?",
      [folderId, me]
    );
    if (!own[0]) return res.status(400).json({ error: "Cartella non valida" });
  }

  const sets: string[] = [];
  const args: any[] = [];
  if (title !== undefined && title.length) { sets.push("title=?"); args.push(title); }
  if (folderId !== undefined) { sets.push("folder_id=?"); args.push(folderId); }
  if (!sets.length) return res.json({ ok: true });

  args.push(threadId);
  await db.query<ResultSetHeader>(`UPDATE chat_threads SET ${sets.join(", ")} WHERE id=?`, args);
  res.json({ ok: true });
});

/** DELETE /api/assistant/thread/:id  → elimina conversazione dell'utente */
router.delete("/thread/:id", requireAuth, async (req: any, res) => {
  const me = Number(req.user.id);
  const threadId = Number(req.params.id) || 0;
  if (!threadId) return res.status(400).json({ error: "threadId non valido" });

  try {
    await assertOwnAssistantThread(me, threadId);
  } catch {
    return res.status(404).json({ error: "Thread inesistente" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM chat_messages WHERE thread_id=?", [threadId]);
    await conn.query("DELETE FROM chat_participants WHERE thread_id=?", [threadId]);
    await conn.query("DELETE FROM chat_threads WHERE id=?", [threadId]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    res.status(500).json({ error: "Errore eliminazione thread" });
  } finally {
    conn.release();
  }
});

/** POST /api/assistant/thread/:id/send { text, model? } → invia + reply bot + titolo auto (+ botUserId) */
router.post("/thread/:id/send", requireAuth, async (req: any, res) => {
  const me = Number(req.user.id);
  const threadId = Number(req.params.id) || 0;
  const text = String(req.body?.text || "").trim();
  const requestedModel = typeof req.body?.model === "string" ? req.body.model : undefined; // ✅ opzionale

  if (!threadId || !text) return res.status(400).json({ error: "Dati non validi" });

  try {
    await assertOwnAssistantThread(me, threadId);
  } catch {
    return res.status(404).json({ error: "Thread inesistente" });
  }

  // Ultimi 20 messaggi per il contesto
  const [histRows] = await db.query<RowDataPacket[]>(
    `
    SELECT sender_id AS senderId, body
    FROM chat_messages
    WHERE thread_id=?
    ORDER BY id DESC
    LIMIT 20
    `,
    [threadId]
  );
  const history = histRows
    .reverse()
    .map(r => ({ role: r.senderId === me ? "user" as const : "assistant" as const, content: String(r.body || "") }));

  // 1) Messaggio utente
  const [insUser] = await db.query<ResultSetHeader>(
    "INSERT INTO chat_messages (thread_id, sender_id, body) VALUES (?, ?, ?)",
    [threadId, me, text]
  );

  // 2) Titolo automatico se ancora generico (usa lo stesso picker del modello)
  const [tRows] = await db.query<RowDataPacket[]>(
    "SELECT title FROM chat_threads WHERE id=? LIMIT 1",
    [threadId]
  );
  const currentTitle = String(tRows?.[0]?.title || "");
  if (!currentTitle || /^nuova conversazione$/i.test(currentTitle)) {
    const ai = await askModelForTitle(text, requestedModel);
    const fallback = fallbackTitleFrom(text);
    const newTitle = (ai || fallback).trim();
    if (newTitle && newTitle !== currentTitle) {
      await db.query<ResultSetHeader>("UPDATE chat_threads SET title=? WHERE id=?", [newTitle, threadId]);
    }
  }

  // 3) Genera risposta bot (ritorna anche il modello usato)
  let reply = "Non ho una risposta al momento.";
  let modelUsed = pickModel(requestedModel);
  try {
    const out = await generateBotReply([...history, { role: "user", content: text }], requestedModel);
    reply = out.text;
    modelUsed = out.modelUsed;
  } catch {
    reply = "Si è verificato un errore nel generare la risposta.";
  }

  // 4) Messaggio bot
  const botId = await getBotUserId();
  const [insBot] = await db.query<ResultSetHeader>(
    "INSERT INTO chat_messages (thread_id, sender_id, body) VALUES (?, ?, ?)",
    [threadId, botId, reply]
  );

  res.json({
    threadId,
    messageUser: { id: insUser.insertId, senderId: me, body: text },
    messageBot:  { id: insBot.insertId, senderId: botId, body: reply },
    botUserId: botId,
    modelUsed, // ✅ utile per UI/debug
  });
});

/* ------------------------ HEALTH CHECK ------------------------ */
/** Rotta diagnostica per capire subito se è DB o Ollama */
router.get("/health", async (_req, res) => {
  const out: any = { ok: true, checks: {} };

  // DB connectivity + BOT_USER_ID
  try {
    const [dbInfo] = await db.query<RowDataPacket[]>("SELECT DATABASE() AS db, CURRENT_USER() AS user");
    out.checks.db = "ok";
    out.checks.dbInfo = dbInfo?.[0] || null;

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT CAST(v AS UNSIGNED) AS botId FROM app_settings WHERE k='BOT_USER_ID' LIMIT 1"
    );
    out.checks.botUserId = rows?.[0]?.botId ?? null;
    if (!out.checks.botUserId) {
      out.ok = false;
      out.checks.app_settings = "BOT_USER_ID mancante";
    }
  } catch (e: any) {
    out.ok = false;
    out.checks.db = "error: " + (e?.message || e);
  }

  // Ollama reachability
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`);
    out.checks.ollama = r.ok ? "ok" : `http ${r.status}`;
  } catch (e: any) {
    out.ok = false;
    out.checks.ollama = "error: " + (e?.message || e);
  }

  // Modello selezionato (in base a LOW_MEMORY o override eventuali lato client)
  out.checks.modelSelected = (String(process.env.LOW_MEMORY ?? "0") === "1")
    ? (process.env.OLLAMA_MODEL_LIGHT || "qwen2.5:1.5b-instruct")
    : (process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct");

  res.json(out);
});

export default router;
