import { Router } from "express";
import db from "../db";
import requireAuth from "../middleware/requireAuth";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const router = Router();

/** Utility: ordina due ID per chiave unica */
function orderedPair(a: number, b: number) {
  return a < b ? ([a, b] as const) : ([b, a] as const);
}

/**
 * POST /api/chat/start
 * body: { toUserId: number, text?: string }
 * - Se esiste già un thread tra i due utenti → lo riusa
 * - Altrimenti crea thread + due partecipanti + eventuale primo messaggio
 */
router.post("/start", requireAuth, async (req: any, res) => {
  const me = req.user.id as number;
  const { toUserId, text } = req.body || {};
  if (!toUserId || toUserId === me) {
    return res.status(400).json({ error: "toUserId non valido" });
  }

  const [a, b] = orderedPair(me, toUserId);

  // cerca link esistente
  const [linkRows] = await db.query<RowDataPacket[]>(
    "SELECT thread_id FROM chat_links WHERE user_a=? AND user_b=? LIMIT 1",
    [a, b]
  );
  let threadId = (linkRows[0]?.thread_id as number) | 0 || undefined;

  if (!threadId) {
    // crea thread
    const [thrIns] = await db.query<ResultSetHeader>("INSERT INTO chat_threads () VALUES ()");
    threadId = thrIns.insertId;

    // partecipanti
    await db.query("INSERT INTO chat_participants (thread_id, user_id) VALUES (?, ?), (?, ?)", [
      threadId,
      a,
      threadId,
      b,
    ]);

    // link
    await db.query("INSERT INTO chat_links (user_a, user_b, thread_id) VALUES (?, ?, ?)", [a, b, threadId]);
  }

  // messaggio iniziale opzionale
  if (text && String(text).trim()) {
    await db.query<ResultSetHeader>(
      "INSERT INTO chat_messages (thread_id, sender_id, body) VALUES (?, ?, ?)",
      [threadId, me, String(text).trim()]
    );
  }

  res.json({ ok: true, threadId });
});

/**
 * GET /api/chat/threads
 * - Lista dei thread dell'utente, con info dell’altro partecipante e ultimo messaggio
 */
router.get("/threads", requireAuth, async (req: any, res) => {
  const me = req.user.id as number;

  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      t.id                  AS threadId,
      u.id                  AS otherUserId,
      u.username            AS otherUsername,
      u.email               AS otherEmail,
      pm.body               AS lastBody,
      pm.created_at         AS lastAt
    FROM chat_threads t
    JOIN chat_participants cpMe
      ON cpMe.thread_id = t.id AND cpMe.user_id = ?
    JOIN chat_participants cpOt
      ON cpOt.thread_id = t.id AND cpOt.user_id <> ?
    JOIN users u
      ON u.id = cpOt.user_id
    /* ---- ultimo messaggio per thread (MySQL) ---- */
    LEFT JOIN (
      SELECT m1.thread_id, m1.body, m1.created_at
      FROM chat_messages m1
      JOIN (
        SELECT thread_id, MAX(id) AS max_id
        FROM chat_messages
        GROUP BY thread_id
      ) last ON last.thread_id = m1.thread_id AND last.max_id = m1.id
    ) pm ON pm.thread_id = t.id
    /* ---- emula NULLS LAST ---- */
    ORDER BY (pm.created_at IS NULL) ASC, pm.created_at DESC, t.id DESC
    `,
    [me, me]
  );

  res.json(rows);
});

/**
 * GET /api/chat/:threadId/messages
 * - Messaggi del thread (verifica che l’utente sia partecipante)
 */
router.get("/:threadId/messages", requireAuth, async (req: any, res) => {
  const me = req.user.id as number;
  const threadId = Number(req.params.threadId);
  if (!threadId) return res.status(400).json({ error: "threadId non valido" });

  const [own] = await db.query<RowDataPacket[]>(
    "SELECT 1 FROM chat_participants WHERE thread_id=? AND user_id=?",
    [threadId, me]
  );
  if (!own[0]) return res.status(403).json({ error: "Non partecipi a questo thread" });

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, sender_id AS senderId, body, created_at AS createdAt FROM chat_messages WHERE thread_id=? ORDER BY id ASC",
    [threadId]
  );
  res.json(rows);
});

/**
 * POST /api/chat/:threadId/messages
 * body: { body: string }
 * - Invia messaggio nel thread se partecipante
 */
router.post("/:threadId/messages", requireAuth, async (req: any, res) => {
  const me = req.user.id as number;
  const threadId = Number(req.params.threadId);
  const { body } = req.body || {};
  if (!threadId || !body || !String(body).trim()) {
    return res.status(400).json({ error: "Dati non validi" });
  }

  const [own] = await db.query<RowDataPacket[]>(
    "SELECT 1 FROM chat_participants WHERE thread_id=? AND user_id=?",
    [threadId, me]
  );
  if (!own[0]) return res.status(403).json({ error: "Non partecipi a questo thread" });

  const [ins] = await db.query<ResultSetHeader>(
    "INSERT INTO chat_messages (thread_id, sender_id, body) VALUES (?, ?, ?)",
    [threadId, me, String(body).trim()]
  );
  res.json({ ok: true, id: ins.insertId });
});

export default router;
