import { Router } from "express";
import db from "../db";
import requireAuth from "../middleware/requireAuth";

const router = Router();

/** Utility: esegue query con try/catch semplice */
async function q<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await db.query(sql, params);
  return rows as T[];
}

/* =========================
   GET /api/schedules
   Lista schede con days_count e creatore (nome)
   ========================= */
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const userId: number | undefined = req.user?.id;
    const userType: "utente" | "professionista" | "admin" | undefined = req.user?.type;

    if (!userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    // Costruisco il pezzo di WHERE in base al tipo utente
    let whereClause = "";
    const params: any[] = [];

    if (userType === "utente") {
      // prendo solo le schede del customer collegato a questo user
      whereClause = "WHERE c.user_id = ?";
      params.push(userId);
    } else if (userType === "professionista") {
      // prendo solo le schede dove il professionista collegato è questo user
      whereClause = "WHERE f.user_id = ?";
      params.push(userId);
    } else {
      // (eventuale admin: vede tutto)
      whereClause = "";
    }

    const rows = await q<any>(
      `
      SELECT
        s.id,
        s.customer_id,
        s.freelancer_id,
        s.goal,
        s.expire,
        COUNT(DISTINCT d.id) AS days_count,

        -- Nome creatore: se freelancer_id non è NULL, prendo user del freelancer
        CASE
          WHEN s.freelancer_id IS NOT NULL THEN
            CONCAT(u_pf.first_name, ' ', u_pf.last_name)
          ELSE
            CONCAT(u_c.first_name, ' ', u_c.last_name)
        END AS creator
      FROM schedules s
      LEFT JOIN days d ON d.schedule_id = s.id

      -- utente del cliente
      LEFT JOIN customers c   ON c.id = s.customer_id
      LEFT JOIN users u_c     ON u_c.id = c.user_id

      -- utente del professionista
      LEFT JOIN freelancers f ON f.id = s.freelancer_id
      LEFT JOIN users u_pf    ON u_pf.id = f.user_id

      ${whereClause}
      GROUP BY s.id
      ORDER BY s.id DESC
    `,
      params
    );

    res.json(rows);
  } catch (e) {
    console.error("GET /api/schedules error:", e);
    res.status(500).json({ error: "Errore interno" });
  }
});

/* =========================
   GET /api/schedules/:id
   Dettaglio completo con days + exercises
   ========================= */
router.get("/:id", requireAuth, async (req: any, res) => {
  try {
    const scheduleId = Number(req.params.id);
    if (!Number.isFinite(scheduleId)) return res.status(400).json({ error: "ID non valido" });

    const headRows = await q<any>(`
      SELECT
        s.id,
        s.goal,
        s.expire,
        s.customer_id,
        s.freelancer_id,

        -- per etichetta creatore lato FE
        CASE
          WHEN s.freelancer_id IS NOT NULL THEN u_pf.id
          ELSE u_c.id
        END AS creator_user_id,

        CASE
          WHEN s.freelancer_id IS NOT NULL THEN u_pf.first_name
          ELSE u_c.first_name
        END AS creator_first_name,

        CASE
          WHEN s.freelancer_id IS NOT NULL THEN u_pf.last_name
          ELSE u_c.last_name
        END AS creator_last_name

      FROM schedules s
        LEFT JOIN customers c   ON c.id = s.customer_id
        LEFT JOIN users u_c     ON u_c.id = c.user_id
        LEFT JOIN freelancers f ON f.id = s.freelancer_id
        LEFT JOIN users u_pf    ON u_pf.id = f.user_id
      WHERE s.id = ?
      LIMIT 1
    `, [scheduleId]);

    const head = headRows[0];
    if (!head) return res.status(404).json({ error: "Scheda non trovata" });

    // Days
    const dayRows = await q<any>(`
      SELECT id, day
      FROM days
      WHERE schedule_id = ?
      ORDER BY day ASC, id ASC
    `, [scheduleId]);

    // Exercises per day
    const days = [];
    for (const d of dayRows) {
      const exRows = await q<any>(`
        SELECT
          se.exercise_id,
          e.title AS name,
          e.musclegroups_id,
          se.position,
          se.sets,
          se.reps,
          se.rest_seconds,
          se.weight_value,
          se.notes
        FROM schedule_exercise se
          LEFT JOIN exercises e ON e.id = se.exercise_id
        WHERE se.day_id = ?
        ORDER BY se.position ASC, se.id ASC
      `, [d.id]);

      days.push({
        id: d.id,
        day: d.day,
        exercises: exRows.map(r => ({
          exercise_id: r.exercise_id,
          name: r.name,
          musclegroups_id: r.musclegroups_id,
          sets: r.sets ?? null,
          reps: r.reps ?? null,
          rest_seconds: r.rest_seconds ?? null,
          weight_value: r.weight_value ?? null,
          notes: r.notes ?? null,
        })),
      });
    }

    res.json({
      id: head.id,
      goal: head.goal,
      expire: head.expire,
      customer_id: head.customer_id,
      freelancer_id: head.freelancer_id,
      creator_user_id: head.creator_user_id,
      creator_first_name: head.creator_first_name,
      creator_last_name: head.creator_last_name,
      creator: [head.creator_first_name, head.creator_last_name].filter(Boolean).join(" ").trim(), // per compat
      days,
    });
  } catch (e) {
    console.error("GET /api/schedules/:id error:", e);
    res.status(500).json({ error: "Errore interno" });
  }
});

/* =========================
   POST /api/schedules
   Crea testa scheda. freelancer_id viene risolto se l'utente è un professionista.
   body: { customer_id, expire, goal }
   ========================= */
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const userId: number = req.user?.id;
    const { customer_id, expire, goal } = req.body || {};

    if (!customer_id) return res.status(400).json({ error: "customer_id obbligatorio" });

    // Se l'utente è un professionista, prova a risolvere freelancer_id
    const fr = await q<{ id: number }>(`SELECT id FROM freelancers WHERE user_id = ? LIMIT 1`, [userId]);
    const freelancer_id = fr[0]?.id ?? null;

    const result: any = await db.query(
      `INSERT INTO schedules (customer_id, freelancer_id, expire, goal) VALUES (?,?,?,?)`,
      [customer_id, freelancer_id, expire || null, goal || null]
    );
    const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;

    res.status(201).json({ id: insertId });
  } catch (e) {
    console.error("POST /api/schedules error:", e);
    res.status(500).json({ error: "Errore creazione scheda" });
  }
});

/* =========================
   POST /api/schedules/day
   Crea un giorno (tabella: days)
   body: { schedule_id, day }
   ========================= */
router.post("/day", requireAuth, async (req: any, res) => {
  try {
    const { schedule_id, day } = req.body || {};
    if (!schedule_id || !day) return res.status(400).json({ error: "schedule_id e day obbligatori" });

    const result: any = await db.query(
      `INSERT INTO days (schedule_id, day) VALUES (?,?)`,
      [schedule_id, day]
    );
    const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
    res.status(201).json({ id: insertId });
  } catch (e) {
    console.error("POST /api/schedules/day error:", e);
    res.status(500).json({ error: "Errore creazione giorno" });
  }
});

/* =========================
   POST /api/schedules/exercises
   Inserimento bulk righe in schedule_exercise
   body: { scheduleId, items: [{ day_id, exercise_id, position, sets, reps, rest_seconds, weight_value, notes }] }
   ========================= */
router.post("/exercises", requireAuth, async (req: any, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Nessun esercizio da inserire" });
    }

    // Insert multiplo
    const valuesSql = items.map(() => `(?,?,?,?,?,?,?,?)`).join(",");
    const params: any[] = [];
    for (const it of items) {
      params.push(
        it.day_id,
        it.exercise_id,
        it.position ?? 1,
        it.sets ?? null,
        it.reps ?? null,
        it.rest_seconds ?? null,
        it.weight_value ?? null,
        it.notes ?? null
      );
    }

    await db.query(
      `
      INSERT INTO schedule_exercise
        (day_id, exercise_id, position, sets, reps, rest_seconds, weight_value, notes)
      VALUES ${valuesSql}
      `,
      params
    );

    res.json({ ok: true, inserted: items.length });
  } catch (e) {
    console.error("POST /api/schedules/exercises error:", e);
    res.status(500).json({ error: "Errore salvataggio esercizi" });
  }
});

/* =========================
   PUT /api/schedules/:id
   Aggiorna meta (expire, goal)
   ========================= */
router.put("/:id", requireAuth, async (req: any, res) => {
  try {
    const scheduleId = Number(req.params.id);
    if (!Number.isFinite(scheduleId)) return res.status(400).json({ error: "ID non valido" });

    const { expire, goal } = req.body || {};
    await db.query(
      `UPDATE schedules SET expire = ?, goal = ? WHERE id = ?`,
      [expire ?? null, goal ?? null, scheduleId]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("PUT /api/schedules/:id error:", e);
    res.status(500).json({ error: "Errore aggiornamento scheda" });
  }
});

/* =========================
   POST /api/schedules/:id/replace
   Rimpiazza giorni + esercizi in transazione
   body: { days: [{ day, exercises: [{ position, exercise_id, name?, sets, reps, rest_seconds, weight_value, notes }] }] }
   NOTA: lo schema reale non ha "name" nell'item; lo usiamo solo se exercise_id è null (saltiamo in quel caso).
   ========================= */
router.post("/:id/replace", requireAuth, async (req: any, res) => {
  const conn = await (db as any).getConnection();
  try {
    const scheduleId = Number(req.params.id);
    if (!Number.isFinite(scheduleId)) {
      conn.release();
      return res.status(400).json({ error: "ID non valido" });
    }

    const { days } = req.body || {};
    if (!Array.isArray(days)) {
      conn.release();
      return res.status(400).json({ error: "days mancante o non array" });
    }

    await conn.beginTransaction();

    // Cancella tutto l'attuale
    await conn.query(`DELETE se FROM schedule_exercise se
                      JOIN days d ON d.id = se.day_id
                      WHERE d.schedule_id = ?`, [scheduleId]);
    await conn.query(`DELETE FROM days WHERE schedule_id = ?`, [scheduleId]);

    // Re-inserisci
    for (const d of days) {
      const [insDay]: any = await conn.query(
        `INSERT INTO days (schedule_id, day) VALUES (?,?)`,
        [scheduleId, d.day]
      );
      const dayId = insDay.insertId;

      const items = Array.isArray(d.exercises) ? d.exercises : [];
      if (items.length) {
        const valuesSql = items
          .filter((it: any) => it.exercise_id) // con il tuo schema serve l'id esercizio
          .map(() => `(?,?,?,?,?,?,?,?)`).join(",");
        if (valuesSql) {
          const params: any[] = [];
          for (const it of items) {
            if (!it.exercise_id) continue;
            params.push(
              dayId,
              it.exercise_id,
              it.position ?? 1,
              it.sets ?? null,
              it.reps ?? null,
              it.rest_seconds ?? null,
              it.weight_value ?? null,
              it.notes ?? null
            );
          }
          await conn.query(
            `INSERT INTO schedule_exercise
             (day_id, exercise_id, position, sets, reps, rest_seconds, weight_value, notes)
             VALUES ${valuesSql}`,
            params
          );
        }
      }
    }

    await conn.commit();
    conn.release();
    res.json({ ok: true });
  } catch (e) {
    try { await (conn as any).rollback(); } catch {}
    try { (conn as any).release?.(); } catch {}
    console.error("POST /api/schedules/:id/replace error:", e);
    res.status(500).json({ error: "Errore replace scheda" });
  }
});

export default router;
