import { Router } from 'express';
import pool from '../db.js';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const schema = z.object({
  username: z.string().min(3).max(32)
});

export const router = Router();

// Upsert "username" for demo purposes (no password for simplicity)
router.post('/login', async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { username } = parsed.data;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
    let userId: number;
    if (Array.isArray(rows) && rows.length > 0) {
      userId = (rows[0] as any).id;
    } else {
      const [result] = await conn.query('INSERT INTO users (username) VALUES (?)', [username]);
      userId = (result as any).insertId;
    }
    await conn.commit();
    const token = jwt.sign({ sub: userId, username }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    res.json({ token, userId, username });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});
