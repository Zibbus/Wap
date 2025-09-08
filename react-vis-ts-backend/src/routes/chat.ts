import { Router } from 'express';
import pool from '../db.js';
import { z } from 'zod';

export const router = Router();

// Create or get a 1:1 conversation between two users
const convSchema = z.object({
  userA: z.number().int().positive(),
  userB: z.number().int().positive()
});

router.post('/conversation', async (req, res) => {
  const parsed = convSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { userA, userB } = parsed.data;
  if (userA === userB) return res.status(400).json({ error: 'same_user' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Try to find existing 1:1 conversation
    const [rows] = await conn.query(
      `SELECT c.id
       FROM conversations c
       JOIN conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = ?
       JOIN conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = ?
       GROUP BY c.id
       HAVING COUNT(*) = 2`,
      [userA, userB]
    );
    let conversationId: number | null = null;
    if (Array.isArray(rows) && rows.length > 0) {
      conversationId = (rows[0] as any).id;
    } else {
      const [result] = await conn.query('INSERT INTO conversations () VALUES ()');
      conversationId = (result as any).insertId;
      await conn.query('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)', [conversationId, userA, conversationId, userB]);
    }
    await conn.commit();
    res.json({ conversationId });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

// Get last N messages in a conversation
router.get('/messages/:conversationId', async (req, res) => {
  const conversationId = Number(req.params.conversationId);
  const limit = Math.min(Number(req.query.limit || 50), 200);

  const [rows] = await pool.query(
    'SELECT id, conversation_id, sender_id, body, created_at FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?',
    [conversationId, limit]
  );
  res.json({ items: rows });
});
