import { Router } from "express";
import db from "../db";
import requireAuth from "../middleware/requireAuth";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const router = Router();

/** Utility: ordina due ID per chiave unica */
function orderedPair(a: number, b: number) {
  return a < b ? [a, b] as const : [b, a] as const;
}

/**
 * POST /api/chat/start-by-username
 * body: { toUsername: string, text?: string }
 * - Risolve l'utente di destinazione da username (UNIQUE)
 * - Crea/riusa thread tra il chiamante e il destinatario
 * - Aggiunge opzionalmente un primo messaggio
 */
router.post("/start-by-username", requireAuth, async (req: any, res) => {
  const me = Number(req.user.id);
  const { toUsername, text } = req.body || {};

  if (!toUsername || typeof toUsername !== "string") {
    return res.status(400).json({ error: "toUsername mancante o non valido" });
  }

  try {
    // 1) trova l'utente destinatario
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [toUsername.trim()]
    );
    const target = rows[0];
    if (!target?.id) return res.status(404).json({ error: "Utente destinatario non trovato" });

    const toUserId = Number(target.id);
    if (!toUserId || toUserId === me) {
      return res.status(400).json({ error: "Destinatario non valido" });
    }

    // 2) ordina la coppia per usare chat_links (user_a,user_b) unico
    const [a, b] = orderedPair(me, toUserId);

    // 3) crea/riusa thread in transazione (evita duplicati in race)
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [linkRows] = await conn.query<RowDataPacket[]>(
        "SELECT thread_id FROM chat_links WHERE user_a=? AND user_b=? LIMIT 1",
        [a, b]
      );

      let threadId: number | undefined =
        linkRows && linkRows[0] && linkRows[0].thread_id
          ? Number(linkRows[0].thread_id)
          : undefined;

      if (!threadId) {
        const [thrIns] = await conn.query<ResultSetHeader>(
          "INSERT INTO chat_threads () VALUES ()"
        );
        threadId = thrIns.insertId;

        await conn.query(
          "INSERT INTO chat_participants (thread_id, user_id) VALUES (?, ?), (?, ?)",
          [threadId, a, threadId, b]
        );

        await conn.query(
          "INSERT INTO chat_links (user_a, user_b, thread_id) VALUES (?, ?, ?)",
          [a, b, threadId]
        );
      }

      const firstText = String(text ?? "").trim();
      if (firstText) {
        await conn.query<ResultSetHeader>(
          "INSERT INTO chat_messages (thread_id, sender_id, body) VALUES (?, ?, ?)",
          [threadId, me, firstText]
        );
      }

      await conn.commit();
      return res.json({ ok: true, threadId });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("chat/start-by-username error:", err);
    return res.status(500).json({ error: "Impossibile avviare la chat" });
  }
});

/**
 * GET /api/chat/threads
 * - Lista dei thread dell'utente, con info dell’altro partecipante e ultimo messaggio
 */
router.get("/threads", requireAuth, async (req: any, res) => {
  const me = req.user.id as number;

  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT t.id AS threadId,
           u.id AS otherUserId,
           u.username AS otherUsername,
           u.email    AS otherEmail,
           pm.body    AS lastBody,
           pm.created_at AS lastAt
    FROM chat_threads t
    JOIN chat_participants cpMe ON cpMe.thread_id = t.id AND cpMe.user_id = ?
    JOIN chat_participants cpOt ON cpOt.thread_id = t.id AND cpOt.user_id <> ?
    JOIN users u ON u.id = cpOt.user_id
    LEFT JOIN LATERAL (
      SELECT m.body, m.created_at
      FROM chat_messages m
      WHERE m.thread_id = t.id
      ORDER BY m.id DESC
      LIMIT 1
    ) pm ON TRUE
    ORDER BY pm.created_at DESC NULLS LAST, t.id DESC
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
