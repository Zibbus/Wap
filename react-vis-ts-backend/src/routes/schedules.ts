import { Router, Request, Response } from "express";
import db from "../db";
import requireAuth from "../middleware/requireAuth";

const router = Router();

/** Helpers */
const isInt = (v: any) => Number.isInteger(Number(v));
const isNonEmptyStr = (v: any) => typeof v === "string" && v.trim() !== "";
const GOALS = new Set(["peso_costante", "aumento_peso", "perdita_peso", "altro"]);

/**
 * POST /api/schedules
 * Body: { customer_id:number, freelancer_id?:number, expire:string('YYYY-MM-DD'), goal:'peso_costante'|'aumento_peso'|'perdita_peso'|'altro' }
 * Ritorna: { id:number }
 */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { customer_id, freelancer_id, expire, goal } = req.body || {};

    if (!isInt(customer_id)) {
      return res.status(400).json({ error: "customer_id mancante o non valido" });
    }
    if (!isNonEmptyStr(expire)) {
      return res.status(400).json({ error: "expire mancante" });
    }
    if (!GOALS.has(String(goal))) {
      return res.status(400).json({ error: "goal non valido" });
    }

    // opzionale: verifica che esista il customer
    const [cRows] = await db.query("SELECT id FROM customers WHERE id = ? LIMIT 1", [Number(customer_id)]);
    if ((cRows as any[]).length === 0) {
      return res.status(400).json({ error: "customer inesistente" });
    }

    // se presente freelancer_id, verificalo
    let finalFreelancerId: number | null = null;
    if (freelancer_id != null) {
      if (!isInt(freelancer_id)) {
        return res.status(400).json({ error: "freelancer_id non valido" });
      }
      const [fRows] = await db.query("SELECT id FROM freelancers WHERE id = ? LIMIT 1", [Number(freelancer_id)]);
      if ((fRows as any[]).length === 0) {
        return res.status(400).json({ error: "freelancer inesistente" });
      }
      finalFreelancerId = Number(freelancer_id);
    }

    const [ins] = await db.query(
      `INSERT INTO schedules (customer_id, freelancer_id, expire, goal)
       VALUES (?, ?, ?, ?)`,
      [Number(customer_id), finalFreelancerId, expire, String(goal)]
    );

    return res.status(201).json({ id: (ins as any).insertId });
  } catch (err) {
    console.error("[POST /api/schedules] error", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /api/schedules/day
 * Body: { schedule_id:number, day:number(1..7) }
 * Ritorna: { id:number }
 */
router.post("/day", requireAuth, async (req: Request, res: Response) => {
  try {
    const { schedule_id, day } = req.body || {};
    if (!isInt(schedule_id)) return res.status(400).json({ error: "schedule_id non valido" });
    const d = Number(day);
    if (!isInt(day) || d < 1 || d > 7) return res.status(400).json({ error: "day deve essere 1..7" });

    // opzionale: verifica schedule
    const [sRows] = await db.query("SELECT id FROM schedules WHERE id = ? LIMIT 1", [Number(schedule_id)]);
    if ((sRows as any[]).length === 0) return res.status(400).json({ error: "schedule inesistente" });

    const [ins] = await db.query(
      `INSERT INTO days (schedule_id, day) VALUES (?, ?)`,
      [Number(schedule_id), d]
    );
    return res.status(201).json({ id: (ins as any).insertId });
  } catch (err) {
    console.error("[POST /api/schedules/day] error", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /api/schedules/exercises
 * Body: { scheduleId:number, items: Array<{ day_id:number, exercise_id:number, position:number, sets:number|null, reps:number|null, rest_seconds:number|null, weight_value:number|null, notes:string|null }> }
 */
router.post("/exercises", requireAuth, async (req: Request, res: Response) => {
  try {
    const { scheduleId, items } = req.body || {};
    if (!isInt(scheduleId)) return res.status(400).json({ error: "scheduleId non valido" });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "items vuoto" });

    const conn = await (db as any).getConnection();
    try {
      await conn.beginTransaction();

      const sql =
        `INSERT INTO schedule_exercise
           (day_id, exercise_id, position, sets, reps, rest_seconds, weight_value, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      for (const it of items) {
        const dayId = Number(it.day_id);
        const exId = Number(it.exercise_id);
        const pos = Number(it.position ?? 1);

        if (!isInt(dayId) || !isInt(exId) || !isInt(pos)) {
          await conn.rollback(); conn.release();
          return res.status(400).json({ error: "item non valido (day_id/exercise_id/position)" });
        }

        await conn.query(sql, [
          dayId,
          exId,
          pos,
          it.sets ?? null,
          it.reps ?? null,
          it.rest_seconds ?? null,
          it.weight_value ?? null,
          (typeof it.notes === "string" && it.notes.trim() !== "") ? it.notes.trim() : null,
        ]);
      }

      await conn.commit();
      conn.release();
      return res.status(201).json({ ok: true });
    } catch (txErr) {
      try { await conn.rollback(); } catch {}
      try { conn.release(); } catch {}
      console.error("[POST /api/schedules/exercises] tx error", txErr);
      return res.status(500).json({ error: "Errore durante il salvataggio esercizi" });
    }
  } catch (err) {
    console.error("[POST /api/schedules/exercises] error", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
