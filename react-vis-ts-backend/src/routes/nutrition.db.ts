// src/routes/nutrition.db.ts
import { Router } from "express";
import db from "../db";
import requireAuth, { type AuthUser } from "../middleware/requireAuth";

const router = Router();

/* ===========================
   Helper: ricava freelancer_id
   =========================== */
async function resolveFreelancerIdForUser(user?: AuthUser): Promise<number | null> {
  try {
    if (!user || user.type !== "professionista") return null;
    const [rows]: any = await db.query(
      "SELECT id FROM freelancers WHERE user_id = ? LIMIT 1",
      [user.id]
    );
    const row = rows?.[0];
    return row ? Number(row.id) : null;
  } catch {
    return null;
  }
}

/* =========================================================
   CREATE (compatibile con le chiamate esistenti del tuo FE)
   ========================================================= */

/** POST /api/nutrition/plans
 * Crea la "testa" del piano nutrizionale.
 * Body: { customer_id:number, expire:'YYYY-MM-DD', goal:'...', notes?:string|null }
 * - Se l’utente loggato è un professionista, salva automaticamente freelancer_id.
 */
router.post("/plans", requireAuth, async (req, res) => {
  try {
    const { customer_id, expire, goal, notes } = req.body ?? {};
    if (!customer_id || !expire || !goal) {
      return res.status(400).json({ error: "customer_id, expire e goal sono obbligatori" });
    }

    // freelancer_id determinato lato server (ignora qualsiasi body.freelancer_id)
    const freelancer_id = await resolveFreelancerIdForUser(req.user);

    const [result]: any = await db.execute(
      `INSERT INTO nutrition_plans (customer_id, freelancer_id, expire, goal, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [customer_id, freelancer_id, expire, goal, notes ?? null]
    );

    const [rows]: any = await db.execute(`SELECT * FROM nutrition_plans WHERE id = ?`, [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error("[POST /api/nutrition/plans]", e);
    return res.status(500).json({ error: "Errore creazione piano" });
  }
});

/** POST /api/nutrition/days
 * Crea un giorno del piano (1..7) collegato alla testa.
 * Body: { plan_id:number, day:1..7 }
 * Vincolo UNIQUE (plan_id, day) gestito: 409 se esiste già.
 */
router.post("/days", async (req, res) => {
  try {
    const { plan_id, day } = req.body ?? {};
    if (!plan_id || !day) return res.status(400).json({ error: "plan_id e day sono obbligatori" });

    const [result]: any = await db.execute(
      `INSERT INTO nutrition_days (plan_id, day) VALUES (?, ?)`,
      [plan_id, day]
    );

    const [rows]: any = await db.execute(`SELECT * FROM nutrition_days WHERE id = ?`, [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (e: any) {
    if (e?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Giorno già presente per questo piano" });
    }
    console.error("[POST /api/nutrition/days]", e);
    return res.status(500).json({ error: "Errore creazione giorno" });
  }
});

/** POST /api/nutrition/meals
 * Crea un pasto (con posizione) nel giorno.
 * Body: { day_id:number, position:number, name:string, notes?:string|null }
 * Vincolo UNIQUE (day_id, position) consigliato lato DB.
 */
router.post("/meals", async (req, res) => {
  try {
    const { day_id, position, name, notes } = req.body ?? {};
    if (!day_id || !position || !name) {
      return res.status(400).json({ error: "day_id, position e name sono obbligatori" });
    }

    const [result]: any = await db.execute(
      `INSERT INTO nutrition_meals (day_id, position, name, notes)
       VALUES (?, ?, ?, ?)`,
      [day_id, position, name, notes ?? null]
    );

    const [rows]: any = await db.execute(`SELECT * FROM nutrition_meals WHERE id = ?`, [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (e: any) {
    if (e?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "position già presente per questo day_id" });
    }
    console.error("[POST /api/nutrition/meals]", e);
    return res.status(500).json({ error: "Errore creazione pasto" });
  }
});

/** POST /api/nutrition/items/bulk
 * Inserisce in blocco le righe alimento dei pasti in TRANSAZIONE.
 * Body: { items: Array<{ meal_id, position, food_id?, description?, qty?, unit, kcal?, protein_g?, carbs_g?, fat_g? }> }
 * Ritorna: { inserted:number }
 */
router.post("/items/bulk", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { items } = req.body ?? {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items mancante o vuoto" });
    }

    await conn.beginTransaction();

    const values = items.map((it: any) => [
      it.meal_id,
      it.position,
      it.food_id ?? null,
      it.description ?? null,
      it.qty ?? null,
      it.unit,
      it.kcal ?? null,
      it.protein_g ?? null,
      it.carbs_g ?? null,
      it.fat_g ?? null,
    ]);

    const sql = `
      INSERT INTO nutrition_items
        (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
      VALUES ${values.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(",")}
    `;

    await conn.execute(sql, values.flat());
    await conn.commit();
    return res.status(201).json({ inserted: items.length });
  } catch (e) {
    await (conn?.rollback?.());
    console.error("[POST /api/nutrition/items/bulk]", e);
    return res.status(500).json({ error: "Errore salvataggio alimenti" });
  } finally {
    conn.release();
  }
});

/* ==========================================
   TARGETS GIORNALIERI (opzionale, comodo)
   ========================================== */

router.post("/day-targets", async (req, res) => {
  try {
    const {
      day_id,
      kcal_target = null,
      protein_g_target = null,
      carbs_g_target = null,
      fat_g_target = null,
      fiber_g_target = null,
      water_ml_target = null,
    } = req.body ?? {};

    if (!day_id) return res.status(400).json({ error: "day_id obbligatorio" });

    const sql = `
      INSERT INTO nutrition_day_targets
        (day_id, kcal_target, protein_g_target, carbs_g_target, fat_g_target, fiber_g_target, water_ml_target)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        kcal_target=VALUES(kcal_target),
        protein_g_target=VALUES(protein_g_target),
        carbs_g_target=VALUES(carbs_g_target),
        fat_g_target=VALUES(fat_g_target),
        fiber_g_target=VALUES(fiber_g_target),
        water_ml_target=VALUES(water_ml_target)
    `;

    await db.execute(sql, [
      day_id,
      kcal_target,
      protein_g_target,
      carbs_g_target,
      fat_g_target,
      fiber_g_target,
      water_ml_target,
    ]);

    const [rows]: any = await db.execute(
      `SELECT * FROM nutrition_day_targets WHERE day_id = ?`,
      [day_id]
    );
    return res.status(201).json(rows[0] ?? null);
  } catch (e) {
    console.error("[POST /api/nutrition/day-targets]", e);
    return res.status(500).json({ error: "Errore salvataggio target" });
  }
});

/* ==========================================
   READ (rivedere la scheda per intero)
   ========================================== */

router.get("/plans", async (req, res) => {
  try {
    const customer_id = Number(req.query.customer_id);
    if (!customer_id) return res.status(400).json({ error: "customer_id richiesto" });

    const [rows]: any = await db.execute(
      `SELECT * FROM nutrition_plans
       WHERE customer_id = ?
       ORDER BY created_at DESC`,
      [customer_id]
    );
    return res.json(rows);
  } catch (e) {
    console.error("[GET /api/nutrition/plans]", e);
    return res.status(500).json({ error: "Errore lettura piani" });
  }
});

router.get("/plans/:id/full", async (req, res) => {
  try {
    const planId = Number(req.params.id);
    if (!planId) return res.status(400).json({ error: "id non valido" });

    // testa
    const [plans]: any = await db.execute(`SELECT * FROM nutrition_plans WHERE id = ?`, [planId]);
    if (!plans.length) return res.status(404).json({ error: "Piano non trovato" });
    const plan = plans[0];

    // days
    const [days]: any = await db.execute(
      `SELECT * FROM nutrition_days WHERE plan_id = ? ORDER BY day ASC`,
      [planId]
    );
    const dayIds = days.map((d: any) => d.id);

    // targets
    let targets: any[] = [];
    if (dayIds.length) {
      const placeholders = dayIds.map(() => "?").join(",");
      const [t]: any = await db.query(
        `SELECT * FROM nutrition_day_targets WHERE day_id IN (${placeholders})`,
        dayIds
      );
      targets = t;
    }
    const targetByDay: Record<number, any> = {};
    for (const t of targets) targetByDay[t.day_id] = t;

    // meals
    let meals: any[] = [];
    if (dayIds.length) {
      const placeholders = dayIds.map(() => "?").join(",");
      const [m]: any = await db.query(
        `SELECT * FROM nutrition_meals
         WHERE day_id IN (${placeholders})
         ORDER BY day_id ASC, position ASC`,
        dayIds
      );
      meals = m;
    }

    // items
    const mealIds = meals.map((m) => m.id);
    let items: any[] = [];
    if (mealIds.length) {
      const placeholders = mealIds.map(() => "?").join(",");
      const [it]: any = await db.query(
        `SELECT * FROM nutrition_items
         WHERE meal_id IN (${placeholders})
         ORDER BY meal_id ASC, position ASC`,
        mealIds
      );
      items = it;
    }

    const itemsByMeal: Record<number, any[]> = {};
    for (const it of items) {
      (itemsByMeal[it.meal_id] ??= []).push(it);
    }

    const mealsByDay: Record<number, any[]> = {};
    for (const m of meals) {
      (mealsByDay[m.day_id] ??= []).push({ ...m, items: itemsByMeal[m.id] ?? [] });
    }

    const fullDays = days.map((d: any) => ({
      ...d,
      targets: targetByDay[d.id] ?? null,
      meals: mealsByDay[d.id] ?? [],
    }));

    return res.json({ plan, days: fullDays });
  } catch (e) {
    console.error("[GET /api/nutrition/plans/:id/full]", e);
    return res.status(500).json({ error: "Errore lettura piano completo" });
  }
});

/* =========================================================
   ONE-SHOT: salva un piano intero in un'unica transazione
   ========================================================= */

/** POST /api/nutrition/plans/full
 * Body:
 * {
 *   plan: { customer_id, expire:'YYYY-MM-DD', goal, notes? },
 *   days: [...]
 * }
 * Imposta automaticamente freelancer_id se l’utente è un professionista.
 */
router.post("/plans/full", requireAuth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { plan, days } = req.body ?? {};

    if (!plan?.customer_id || !plan?.expire || !plan?.goal || !Array.isArray(days)) {
      return res.status(400).json({ error: "Payload non valido: plan incompleto o days assente" });
    }

    await conn.beginTransaction();

    const freelancer_id = await resolveFreelancerIdForUser(req.user);

    // plan (con freelancer_id lato server)
    const [planRes]: any = await conn.execute(
      `INSERT INTO nutrition_plans (customer_id, freelancer_id, expire, goal, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [plan.customer_id, freelancer_id, plan.expire, plan.goal, plan.notes ?? null]
    );
    const planId = planRes.insertId;

    const itemsValues: any[] = [];

    // days (+ targets) + meals + items
    for (const d of days) {
      const [dayRes]: any = await conn.execute(
        `INSERT INTO nutrition_days (plan_id, day) VALUES (?, ?)`,
        [planId, d.day]
      );
      const dayId = dayRes.insertId;

      if (d.targets) {
        const t = d.targets;
        await conn.execute(
          `INSERT INTO nutrition_day_targets
            (day_id, kcal_target, protein_g_target, carbs_g_target, fat_g_target, fiber_g_target, water_ml_target)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             kcal_target=VALUES(kcal_target),
             protein_g_target=VALUES(protein_g_target),
             carbs_g_target=VALUES(carbs_g_target),
             fat_g_target=VALUES(fat_g_target),
             fiber_g_target=VALUES(fiber_g_target),
             water_ml_target=VALUES(water_ml_target)`,
          [
            dayId,
            t.kcal_target ?? null,
            t.protein_g_target ?? null,
            t.carbs_g_target ?? null,
            t.fat_g_target ?? null,
            t.fiber_g_target ?? null,
            t.water_ml_target ?? null,
          ]
        );
      }

      for (const m of d.meals ?? []) {
        const [mealRes]: any = await conn.execute(
          `INSERT INTO nutrition_meals (day_id, position, name, notes)
           VALUES (?, ?, ?, ?)`,
          [dayId, m.position, m.name, m.notes ?? null]
        );
        const mealId = mealRes.insertId;

        for (const it of m.items ?? []) {
          itemsValues.push([
            mealId,
            it.position,
            it.food_id ?? null,
            it.description ?? null,
            it.qty ?? null,
            it.unit,
            it.kcal ?? null,
            it.protein_g ?? null,
            it.carbs_g ?? null,
            it.fat_g ?? null,
          ]);
        }
      }
    }

    if (itemsValues.length) {
      const placeholders = itemsValues.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(",");
      await conn.execute(
        `INSERT INTO nutrition_items
          (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
         VALUES ${placeholders}`,
        itemsValues.flat()
      );
    }

    await conn.commit();
    return res.status(201).json({ plan_id: planId });
  } catch (e) {
    await (conn?.rollback?.());
    console.error("[POST /api/nutrition/plans/full]", e);
    return res.status(500).json({ error: "Errore salvataggio piano completo" });
  } finally {
    conn.release();
  }
});

export default router;
