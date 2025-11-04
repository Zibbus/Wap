// routes/schedules.ts
import { Router } from "express";
import db from "../db";
import requireAuth, { AuthUser } from "../middleware/requireAuth.js";

const router = Router();

function isValidGoal(goal: any): goal is "peso_costante" | "aumento_peso" | "perdita_peso" | "altro" {
  return ["peso_costante", "aumento_peso", "perdita_peso", "altro"].includes(goal);
}

async function getCustomerIdByUserId(userId: number): Promise<number | null> {
  const [rows] = await db.query("SELECT id FROM customers WHERE user_id = ? LIMIT 1", [userId]);
  const r = (rows as any[])[0];
  return r ? Number(r.id) : null;
}

async function getFreelancerIdByUserId(userId: number): Promise<number | null> {
  const [rows] = await db.query("SELECT id FROM freelancers WHERE user_id = ? LIMIT 1", [userId]);
  const r = (rows as any[])[0];
  return r ? Number(r.id) : null;
}

/**
 * GET /api/schedules
 * Query accettate:
 *  - customer_id?: number
 *
 * Regole:
 * - Utente normale:
 *     - se passa customer_id dev'essere il suo (altrimenti 403)
 *     - se non passa customer_id usiamo quello derivato dall'utente loggato
 * - Professionista:
 *     - se passa customer_id, lo usiamo così com’è (se esiste)
 *     - se non passa customer_id, ritorniamo le schedule create da lui (freelancer_id = suo)
 */
router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user as AuthUser;
  const isPro = user?.type === "professionista";
  const qCustomerId = req.query.customer_id ? Number(req.query.customer_id) : null;

  try {
    let where = "";
    let params: any[] = [];

    if (qCustomerId && Number.isFinite(qCustomerId)) {
      // check esistenza
      const [cRows] = await db.query("SELECT id, user_id FROM customers WHERE id = ? LIMIT 1", [qCustomerId]);
      const cust = (cRows as any[])[0];
      if (!cust) return res.status(400).json({ error: "Profilo cliente non trovato" });

      if (!isPro && Number(cust.user_id) !== Number(user.id)) {
        return res.status(403).json({ error: "Non autorizzato su questo cliente" });
      }

      where = "WHERE s.customer_id = ?";
      params.push(qCustomerId);
    } else {
      if (isPro) {
        // liste del professionista (quelle create da lui)
        const freelancerId = await getFreelancerIdByUserId(Number(user.id));
        if (!freelancerId) {
          return res.json([]); // nessun profilo => nessuna scheda sua
        }
        where = "WHERE s.freelancer_id = ?";
        params.push(freelancerId);
      } else {
        // utente normale -> le sue schede
        const customerId = await getCustomerIdByUserId(Number(user.id));
        if (!customerId) return res.json([]);
        where = "WHERE s.customer_id = ?";
        params.push(customerId);
      }
    }

    const [rows] = await db.query(
      `
      SELECT 
        s.id,
        s.customer_id,
        s.goal,
        s.expire,
        s.freelancer_id,
        COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.username, u.email, CONCAT('user#', u.id)) AS creator,
        (SELECT COUNT(*) FROM days d WHERE d.schedule_id = s.id) AS days_count
      FROM schedules s
      LEFT JOIN freelancers f ON f.id = s.freelancer_id
      LEFT JOIN users u ON u.id = f.user_id
      ${where}
      ORDER BY s.created_at DESC, s.id DESC
      `,
      params
    );

    return res.json(rows);
  } catch (err) {
    console.error("[GET /api/schedules]", err);
    return res.status(500).json({ error: "Errore caricamento schede" });
  }
});

/**
 * GET /api/schedules/:id
 * Dettaglio scheda con giorni + esercizi.
 * Permessi:
 *  - Utente normale: deve essere il proprietario del customer della schedule
 *  - Professionista: deve essere il creatore (freelancer_id suo) **oppure** (facoltativo) avere visibilità su quel customer
 */
router.get("/:id", requireAuth, async (req, res) => {
  const user = (req as any).user as AuthUser;
  const isPro = user?.type === "professionista";
  const id = Number(req.params.id);

  if (!Number.isFinite(id)) return res.status(400).json({ error: "id non valido" });

  try {
    // carica testa
    const [headRows] = await db.query(
      `
      SELECT 
        s.id,
        s.customer_id,
        s.goal,
        s.expire,
        s.freelancer_id,
        COALESCE(CONCAT(uf.first_name, ' ', uf.last_name), uf.username, uf.email, CONCAT('user#', uf.id)) AS creator
      FROM schedules s
      LEFT JOIN freelancers f ON f.id = s.freelancer_id
      LEFT JOIN users uf ON uf.id = f.user_id
      WHERE s.id = ?
      LIMIT 1
      `,
      [id]
    );
    const head = (headRows as any[])[0];
    if (!head) return res.status(404).json({ error: "Scheda non trovata" });

    // permessi
    if (!isPro) {
      // utente normale -> deve combaciare il suo customer
      const myCustomerId = await getCustomerIdByUserId(Number(user.id));
      if (!myCustomerId || Number(head.customer_id) !== myCustomerId) {
        return res.status(403).json({ error: "Non autorizzato" });
      }
    } else {
      // pro: deve essere il creatore (freelancer_id suo)
      const myFreelancerId = await getFreelancerIdByUserId(Number(user.id));
      if (Number(head.freelancer_id || 0) !== Number(myFreelancerId || -1)) {
        // se vuoi, qui potresti anche concedere visibilità “estesa”
        // per semplicità, blocchiamo
        return res.status(403).json({ error: "Non autorizzato" });
      }
    }

    // giorni
    const [dayRows] = await db.query(
      `SELECT id, day FROM days WHERE schedule_id = ? ORDER BY day ASC`,
      [id]
    );
    const days = (dayRows as any[]).map((d) => ({ id: d.id, day: d.day, exercises: [] as any[] }));

    if (days.length) {
      const dayIds = days.map((d) => d.id);
      const [exRows] = await db.query(
        `
        SELECT 
          se.day_id,
          e.title AS name,
          se.sets,
          se.reps,
          se.rest_seconds,
          se.weight_value,
          se.notes,
          se.position
        FROM schedule_exercise se
        INNER JOIN exercises e ON e.id = se.exercise_id
        WHERE se.day_id IN ( ${dayIds.map(() => "?").join(",")} )
        ORDER BY se.day_id ASC, se.position ASC, se.id ASC
        `,
        dayIds
      );

      const byDay = new Map<number, any[]>();
      for (const d of days) byDay.set(d.id, []);
      for (const r of exRows as any[]) {
        byDay.get(r.day_id)!.push({
          name: r.name,
          sets: r.sets ?? null,
          reps: r.reps ?? null,
          rest_seconds: r.rest_seconds ?? null,
          weight_value: r.weight_value ?? null,
          notes: r.notes ?? null,
        });
      }
      for (const d of days) d.exercises = byDay.get(d.id) ?? [];
    }

    return res.json({
      id: head.id,
      goal: head.goal,
      expire: head.expire,
      creator: head.creator,
      days,
    });
  } catch (err) {
    console.error("[GET /api/schedules/:id]", err);
    return res.status(500).json({ error: "Errore caricamento scheda" });
  }
});

/**
 * POST /api/schedules
 * Body:
 *   { customer_id?: number, expire?: 'YYYY-MM-DD'|null, goal: 'peso_costante'|'aumento_peso'|'perdita_peso'|'altro' }
 * (Regole come discusso)
 */
router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user as AuthUser;
  const { customer_id, expire, goal } = (req.body || {}) as {
    customer_id?: number;
    expire?: string | null;
    goal?: string;
  };

  if (!goal || !isValidGoal(goal)) {
    return res.status(400).json({ error: "goal mancante o non valido" });
  }

  const isPro = user?.type === "professionista";

  try {
    let resolvedCustomerId: number | null = null;

    if (typeof customer_id === "number" && Number.isFinite(customer_id)) {
      const [cRows] = await db.query("SELECT id, user_id FROM customers WHERE id = ? LIMIT 1", [customer_id]);
      const cust = (cRows as any[])[0];
      if (!cust) return res.status(400).json({ error: "Profilo cliente non trovato" });

      if (!isPro) {
        if (Number(cust.user_id) !== Number(user.id)) {
          return res.status(403).json({ error: "Non puoi creare schede per altri clienti" });
        }
      }
      resolvedCustomerId = Number(cust.id);
    } else {
      if (isPro) {
        return res.status(400).json({ error: "customer_id mancante" });
      }
      const myCustomerId = await getCustomerIdByUserId(Number(user.id));
      if (!myCustomerId) return res.status(400).json({ error: "Profilo cliente non trovato" });
      resolvedCustomerId = myCustomerId;
    }

    let freelancerId: number | null = null;
    if (isPro) {
      const fid = await getFreelancerIdByUserId(Number(user.id));
      if (fid) freelancerId = fid;
    }

    const [r] = await db.query(
      `INSERT INTO schedules (customer_id, freelancer_id, expire, goal)
       VALUES (?, ?, ?, ?)`,
      [resolvedCustomerId, freelancerId, expire || null, goal]
    );
    const id = (r as any).insertId;

    return res.status(201).json({
      id,
      customer_id: resolvedCustomerId,
      freelancer_id: freelancerId,
      expire: expire || null,
      goal
    });
  } catch (err) {
    console.error("[POST /api/schedules]", err);
    return res.status(500).json({ error: "Errore creazione schedule" });
  }
});

/**
 * POST /api/schedules/day
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
 */
router.post("/exercises", requireAuth, async (req, res) => {
  const { scheduleId, items } = req.body || {};
  if (!scheduleId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Payload mancante" });
  }

  const conn = await (db as any).getConnection();
  try {
    await conn.beginTransaction();

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
