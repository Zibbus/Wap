import { Router } from "express";
import db from "../db";
import requireAuth from "../middleware/requireAuth";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

/* 🔽 NEW: upload allegati */
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

/** Utility: ordina due ID per chiave unica */
function orderedPair(a: number, b: number) {
  return a < b ? ([a, b] as const) : ([b, a] as const);
}

/* ========== MULTER (upload in /uploads) ========== */
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname || ".bin"));
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  // consenti immagini + pdf + office base
  const ok =
    /^image\//.test(file.mimetype) ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // .docx
    file.mimetype === "application/msword" || // .doc
    file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || // .xlsx
    file.mimetype === "application/vnd.ms-excel"; // .xls
  cb(null, ok);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

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

  const [a, b] = orderedPair(me, Number(toUserId));

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
 * POST /api/chat/start-by-username
 * body: { toUsername: string, text?: string }
 */
router.post("/start-by-username", requireAuth, async (req: any, res) => {
  const me = Number(req.user.id);
  const { toUsername, text } = req.body || {};

  if (!toUsername || typeof toUsername !== "string") {
    return res.status(400).json({ error: "toUsername mancante o non valido" });
  }

  try {
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

    const [a, b] = orderedPair(me, toUserId);

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
    SELECT
      t.id          AS threadId,
      u.id          AS otherUserId,
      u.username    AS otherUsername,
      u.email       AS otherEmail,
      COALESCE(u.avatar_url, pp.avatar_url) AS otherAvatarUrl,  -- 👈 fallback
      pm.body       AS lastBody,
      pm.created_at AS lastAt
    FROM chat_threads t
    JOIN chat_participants cpMe
      ON cpMe.thread_id = t.id AND cpMe.user_id = ?
    JOIN chat_participants cpOt
      ON cpOt.thread_id = t.id AND cpOt.user_id <> ?
    JOIN users u
      ON u.id = cpOt.user_id
    LEFT JOIN freelancers f
      ON f.user_id = u.id
    LEFT JOIN professional_profiles pp
      ON pp.freelancer_id = f.id
    LEFT JOIN (
      SELECT m1.thread_id, m1.body, m1.created_at
      FROM chat_messages m1
      JOIN (
        SELECT thread_id, MAX(id) AS max_id
        FROM chat_messages
        GROUP BY thread_id
      ) last ON last.thread_id = m1.thread_id AND last.max_id = m1.id
    ) pm ON pm.thread_id = t.id
    ORDER BY (pm.created_at IS NULL) ASC, pm.created_at DESC, t.id DESC
    `,
    [me, me]
  );

  res.json(rows);
});

/**
 * GET /api/chat/:threadId/messages
 * - Messaggi del thread (verifica che l’utente sia partecipante)
 *   + include eventuali allegati
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
    `
    SELECT
      m.id,
      m.sender_id AS senderId,
      m.body,
      m.created_at AS createdAt,
      a.url AS attachmentUrl,
      a.mime AS attachmentMime,
      a.filename AS attachmentName,
      a.size AS attachmentSize
    FROM chat_messages m
    LEFT JOIN chat_attachments a ON a.message_id = m.id
    WHERE m.thread_id=?
    ORDER BY m.id ASC
    `,
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

/**
 * 🔽 NEW: POST /api/chat/:threadId/attachments
 * - multipart/form-data con field 'file' (+ opzionale 'text' per accompagnare l’allegato)
 */
router.post("/:threadId/attachments", requireAuth, upload.single("file"), async (req: any, res) => {
  const me = req.user.id as number;
  const threadId = Number(req.params.threadId);

  if (!threadId) return res.status(400).json({ error: "threadId non valido" });

  const [own] = await db.query<RowDataPacket[]>(
    "SELECT 1 FROM chat_participants WHERE thread_id=? AND user_id=?",
    [threadId, me]
  );
  if (!own[0]) return res.status(403).json({ error: "Non partecipi a questo thread" });

  if (!req.file) {
    return res.status(400).json({ error: "File mancante o formato non supportato" });
  }

  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  const mime = req.file.mimetype;
  const filename = req.file.originalname || req.file.filename;
  const size = req.file.size || null;

  const text = (req.body?.text ? String(req.body.text).trim() : "") || "";

  // 1) crea il messaggio (body facoltativo)
  const [ins] = await db.query<ResultSetHeader>(
    "INSERT INTO chat_messages (thread_id, sender_id, body) VALUES (?, ?, ?)",
    [threadId, me, text]
  );
  const messageId = ins.insertId;

  // 2) salva record allegato
  await db.query<ResultSetHeader>(
    "INSERT INTO chat_attachments (message_id, url, mime, filename, size) VALUES (?, ?, ?, ?, ?)",
    [messageId, url, mime, filename, size]
  );

  // 3) ritorna il messaggio “arricchito”
  res.json({
    ok: true,
    message: {
      id: messageId,
      senderId: me,
      body: text,
      createdAt: new Date().toISOString(),
      attachmentUrl: url,
      attachmentMime: mime,
      attachmentName: filename,
      attachmentSize: size,
    },
  });
});

export default router;
