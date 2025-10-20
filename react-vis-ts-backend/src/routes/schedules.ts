import { Router } from "express";
import db from "../db";
import requireAuth, { AuthUser } from "../middleware/requireAuth.js";

const router = Router();

/**
 * POST /api/schedules
 * body: { expire: 'YYYY-MM-DD' | null, goal: 'peso_costante'|'aumento_peso'|'perdita_peso'|'altro' }
 * Ricava customer_id dall'utente loggato.
 * return: { id }
 */
router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user as AuthUser;
  const { expire, goal } = req.body || {};
  if (!goal) return res.status(400).json({ error: "goal mancante" });

  try {
    const [cRows] = await db.query(
      "SELECT id FROM customers WHERE user_id = ? LIMIT 1",
      [user.id]
    );
    const customer = (cRows as any[])[0];
    if (!customer) return res.status(400).json({ error: "Profilo cliente non trovato" });

    const [r] = await db.query(
      `INSERT INTO schedules (customer_id, freelancer_id, expire, goal)
       VALUES (?, NULL, ?, ?)`,
      [customer.id, expire || null, goal]
    );
    const id = (r as any).insertId;
    res.status(201).json({ id });
  } catch (err) {
    console.error("[POST /api/schedules]", err);
    res.status(500).json({ error: "Errore creazione schedule" });
  }
});

/**
 * POST /api/schedules/day
 * body: { schedule_id: number, day: 1..7 }
 * return: { id }
 */
router.post("/day", requireAuth, async (req, res) => {
  const { schedule_id, day } = req.body || {};
  const d = Number(day);
  if (!schedule_id || ![1, 2, 3, 4, 5, 6, 7].includes(d)) {
    return res.status(400).json({ error: "Parametri invalidi" });
  }
  try {
    const [r] = await db.query(
      `INSERT INTO days (schedule_id, day) VALUES (?, ?)`,
      [schedule_id, d]
    );
    res.status(201).json({ id: (r as any).insertId });
  } catch (err) {
    console.error("[POST /api/schedules/day]", err);
    res.status(500).json({ error: "Errore creazione giorno" });
  }
});

/**
 * POST /api/schedules/exercises
 * body: { scheduleId: number, items: [{ day_id, exercise_id, position?, sets?, reps?, rest_seconds?, weight_value?, notes? }] }
 * Inserisce in blocco (transazione).
 */
router.post("/exercises", requireAuth, async (req, res) => {
  const { scheduleId, items } = req.body || {};
  if (!scheduleId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Payload mancante" });
  }

  const conn = await (db as any).getConnection();
  try {
    await conn.beginTransaction();

    // Verifica day_id appartenenti alla schedule
    const [dayRows] = await conn.query(
      `SELECT id FROM days WHERE schedule_id = ?`,
      [scheduleId]
    );
    const dayIds = new Set((dayRows as any[]).map((r) => r.id));

    const values: any[] = [];
    for (const it of items) {
      const day_id = Number(it.day_id);
      const exercise_id = Number(it.exercise_id);
      if (!day_id || !exercise_id) {
        throw new Error("day_id o exercise_id mancanti");
      }
      if (!dayIds.has(day_id)) {
        throw new Error(`day_id ${day_id} non appartiene alla schedule ${scheduleId}`);
      }
      values.push([
        day_id,
        exercise_id,
        Number(it.position) || 1,
        it.sets == null || it.sets === "" ? null : Math.max(0, Number(it.sets)),
        it.reps == null || it.reps === "" ? null : Math.max(0, Number(it.reps)),
        it.rest_seconds == null || it.rest_seconds === "" ? null : Math.max(0, Number(it.rest_seconds)),
        it.weight_value == null || it.weight_value === "" ? null : Number(it.weight_value),
        it.notes ?? null,
      ]);
    }

    await conn.query(
      `INSERT INTO schedule_exercise
       (day_id, exercise_id, position, sets, reps, rest_seconds, weight_value, notes)
       VALUES ?`,
      [values]
    );

    await conn.commit();
    res.status(201).json({ inserted: values.length });
  } catch (err: any) {
    console.error("[POST /api/schedules/exercises]", err?.message || err);
    try { await conn.rollback(); } catch {}
    res.status(500).json({ error: "Errore salvataggio esercizi" });
  } finally {
    try { conn.release(); } catch {}
  }
});

export default router;