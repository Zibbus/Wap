// react-vis-ts-backend/src/routes/chat.ts
import { Router } from "express";
import db from "../db";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import requireAuth from "../middleware/requireAuth";

const router = Router();

/** Lista conversazioni */
router.get("/", requireAuth, async (req: any, res) => {
  const userId = req.user.id as number;

  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      c.id                             AS conversationId,
      CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS peerId,
      u.username                       AS peerName,
      u.email                          AS peerEmail,
      lm.body                          AS lastBody,
      lm.created_at                    AS lastCreatedAt
    FROM conversations c
    JOIN users u
      ON u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
    LEFT JOIN LATERAL (
      SELECT m.body, m.created_at
      FROM messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) lm ON TRUE
    WHERE c.user1_id = ? OR c.user2_id = ?
    ORDER BY COALESCE(lm.created_at, c.created_at) DESC
    `,
    [userId, userId, userId, userId]
  );

  const data = rows.map(r => ({
    conversationId: Number(r.conversationId),
    peer: { id: Number(r.peerId), name: String(r.peerName), email: r.peerEmail as string | null },
    lastMessage: r.lastBody
      ? { body: String(r.lastBody), createdAt: new Date(r.lastCreatedAt as string).toISOString() }
      : null,
  }));

  res.json(data);
});

/** Messaggi di una conversazione */
router.get("/:conversationId/messages", requireAuth, async (req: any, res) => {
  const conversationId = Number(req.params.conversationId);

  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT id, sender_id AS senderId, body, created_at AS createdAt
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
    `,
    [conversationId]
  );

  const messages = rows.map(r => ({
    id: Number(r.id),
    senderId: Number(r.senderId),
    body: String(r.body),
    createdAt: new Date(r.createdAt as string).toISOString(),
  }));

  res.json(messages);
});

/** Invio messaggio */
router.post("/:conversationId/messages", requireAuth, async (req: any, res) => {
  const conversationId = Number(req.params.conversationId);
  const senderId = req.user.id as number;
  const { body } = req.body as { body: string };

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)`,
    [conversationId, senderId, body]
  );

  const insertedId = result.insertId;

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, sender_id AS senderId, body, created_at AS createdAt FROM messages WHERE id = ?`,
    [insertedId]
  );

  const r = rows[0];
  res.json({
    id: Number(r.id),
    senderId: Number(r.senderId),
    body: String(r.body),
    createdAt: new Date(r.createdAt as string).toISOString(),
  });
});

export default router;
