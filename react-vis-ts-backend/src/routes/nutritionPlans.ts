import { Router } from "express";
import db from "../db";
import requireAuth, { AuthUser } from "../middleware/requireAuth.js";

const router = Router();

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

function ensureGoal(v: any): string | null {
  const allowed = new Set([
    "aumento_peso",
    "perdita_peso",
    "mantenimento",
    "definizione",
    "massa",
    "altro",
  ]);
  if (!v || typeof v !== "string") return null;
  return allowed.has(v) ? v : null;
}

/**
 * GET /api/nutrition/plans
 * ?customer_id opzionale
 * - Utente: se non passa customer_id -> i suoi piani
 * - Pro: se non passa customer_id -> i piani creati da lui (freelancer_id = suo)
 */
router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user as AuthUser;
  const isPro = user?.type === "professionista";
  const qCustomerId = req.query.customer_id ? Number(req.query.customer_id) : null;

  try {
    let where = "";
    const params: any[] = [];

    if (qCustomerId && Number.isFinite(qCustomerId)) {
      const [cRows] = await db.query("SELECT id, user_id FROM customers WHERE id = ? LIMIT 1", [qCustomerId]);
      const cust = (cRows as any[])[0];
      if (!cust) return res.status(400).json({ error: "Profilo cliente non trovato" });
      if (!isPro && Number(cust.user_id) !== Number(user.id)) {
        return res.status(403).json({ error: "Non autorizzato su questo cliente" });
      }
      where = "WHERE np.customer_id = ?";
      params.push(qCustomerId);
    } else {
      if (isPro) {
        const fid = await getFreelancerIdByUserId(Number(user.id));
        if (!fid) return res.json([]);
        where = "WHERE np.freelancer_id = ?";
        params.push(fid);
      } else {
        const cid = await getCustomerIdByUserId(Number(user.id));
        if (!cid) return res.json([]);
        where = "WHERE np.customer_id = ?";
        params.push(cid);
      }
    }

    const [rows] = await db.query(
      `
      SELECT 
        np.id,
        np.customer_id,
        np.goal,
        np.expire,
        np.freelancer_id,
        -- creator: se pro -> utente del freelancer, altrimenti utente del customer
        CASE
          WHEN np.freelancer_id IS NOT NULL THEN
            COALESCE(CONCAT(uf.first_name,' ',uf.last_name), uf.username, uf.email, CONCAT('user#',uf.id))
          ELSE
            COALESCE(CONCAT(uc.first_name,' ',uc.last_name), uc.username, uc.email, CONCAT('user#',uc.id))
        END AS creator,
        CASE
          WHEN np.freelancer_id IS NOT NULL THEN uf.id ELSE uc.id
        END AS creator_user_id,
        CASE
          WHEN np.freelancer_id IS NOT NULL THEN uf.first_name ELSE uc.first_name
        END AS creator_first_name,
        CASE
          WHEN np.freelancer_id IS NOT NULL THEN uf.last_name ELSE uc.last_name
        END AS creator_last_name,
        (SELECT COUNT(*) FROM nutrition_days nd WHERE nd.plan_id = np.id) AS days_count
      FROM nutrition_plans np
      LEFT JOIN freelancers f  ON f.id  = np.freelancer_id
      LEFT JOIN users      uf ON uf.id = f.user_id        -- user del freelancer
      LEFT JOIN customers  c  ON c.id  = np.customer_id
      LEFT JOIN users      uc ON uc.id = c.user_id        -- user del customer
      ${where}
      ORDER BY np.created_at DESC, np.id DESC
      `,
      params
    );

    return res.json(rows);
  } catch (err) {
    console.error("[GET /api/nutrition/plans]", err);
    return res.status(500).json({ error: "Errore caricamento piani" });
  }
});

/**
 * GET /api/nutrition/plans/:id
 * Dettaglio con giorni, pasti e righe
 */
router.get("/:id", requireAuth, async (req, res) => {
  const user = (req as any).user as AuthUser;
  const isPro = user?.type === "professionista";
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "id non valido" });

  try {
    // testa
    const [hRows] = await db.query(
      `
      SELECT 
        np.id, np.customer_id, np.goal, np.expire, np.freelancer_id,
        CASE
          WHEN np.freelancer_id IS NOT NULL THEN
            COALESCE(CONCAT(uf.first_name,' ',uf.last_name), uf.username, uf.email, CONCAT('user#',uf.id))
          ELSE
            COALESCE(CONCAT(uc.first_name,' ',uc.last_name), uc.username, uc.email, CONCAT('user#',uc.id))
        END AS creator,
        CASE WHEN np.freelancer_id IS NOT NULL THEN uf.id ELSE uc.id END AS creator_user_id,
        CASE WHEN np.freelancer_id IS NOT NULL THEN uf.first_name ELSE uc.first_name END AS creator_first_name,
        CASE WHEN np.freelancer_id IS NOT NULL THEN uf.last_name  ELSE uc.last_name  END AS creator_last_name
      FROM nutrition_plans np
      LEFT JOIN freelancers f  ON f.id  = np.freelancer_id
      LEFT JOIN users      uf ON uf.id = f.user_id
      LEFT JOIN customers  c  ON c.id  = np.customer_id
      LEFT JOIN users      uc ON uc.id = c.user_id
      WHERE np.id = ?
      LIMIT 1
      `,
      [id]
    );
    const head = (hRows as any[])[0];
    if (!head) return res.status(404).json({ error: "Piano non trovato" });

    // permessi
    if (!isPro) {
      const myCid = await getCustomerIdByUserId(Number(user.id));
      if (!myCid || Number(head.customer_id) !== myCid) {
        return res.status(403).json({ error: "Non autorizzato" });
      }
    } else {
      const myFid = await getFreelancerIdByUserId(Number(user.id));
      if (Number(head.freelancer_id || 0) !== Number(myFid || -1)) {
        return res.status(403).json({ error: "Non autorizzato" });
      }
    }

    // giorni
    const [dRows] = await db.query(
      `SELECT id, day FROM nutrition_days WHERE plan_id = ? ORDER BY day ASC`,
      [id]
    );
    const days = (dRows as any[]).map((d) => ({
      id: d.id,
      day: d.day,
      meals: [] as any[]
    }));

    if (days.length) {
      const dayIds = days.map((d) => d.id);

      // pasti
      const [mRows] = await db.query(
        `
        SELECT id, day_id, position, name, notes
        FROM nutrition_meals
        WHERE day_id IN (${dayIds.map(() => "?").join(",")})
        ORDER BY day_id ASC, position ASC, id ASC
        `,
        dayIds
      );

      const mealsByDay = new Map<number, any[]>();
      for (const d of days) mealsByDay.set(d.id, []);
      for (const m of mRows as any[]) {
        mealsByDay.get(m.day_id)!.push({ id: m.id, position: m.position, name: m.name, notes: m.notes, items: [] as any[] });
      }

      const mealIds = (mRows as any[]).map((m) => m.id);
      if (mealIds.length) {
        const [iRows] = await db.query(
          `
          SELECT 
            ni.id, ni.meal_id, ni.position,
            ni.food_id, ni.description, ni.qty, ni.unit,
            ni.kcal, ni.protein_g, ni.carbs_g, ni.fat_g,
            f.name AS food_name
          FROM nutrition_items ni
          LEFT JOIN foods f ON f.id = ni.food_id
          WHERE ni.meal_id IN (${mealIds.map(() => "?").join(",")})
          ORDER BY ni.meal_id ASC, ni.position ASC, ni.id ASC
          `,
          mealIds
        );

        const itemsByMeal = new Map<number, any[]>();
        for (const mid of mealIds) itemsByMeal.set(mid, []);
        for (const r of iRows as any[]) {
          itemsByMeal.get(r.meal_id)!.push({
            id: r.id,
            position: r.position,
            label: r.food_name || r.description || "-",
            qty: r.qty,
            unit: r.unit,
            kcal: r.kcal,
            protein_g: r.protein_g,
            carbs_g: r.carbs_g,
            fat_g: r.fat_g,
            // niente fiber_g nel DB -> non mettere
          });
        }

        for (const m of mRows as any[]) {
          const meals = mealsByDay.get(m.day_id)!;
          const target = meals.find((x) => x.id === m.id);
          if (target) target.items = itemsByMeal.get(m.id) ?? [];
        }
      }

      for (const d of days) d.meals = mealsByDay.get(d.id) ?? [];
    }

    return res.json({
      id: head.id,
      goal: head.goal,
      expire: head.expire,
      creator: head.creator,
      freelancer_id: head.freelancer_id,
      customer_id: head.customer_id,
      creator_user_id: head.creator_user_id,
      creator_first_name: head.creator_first_name,
      creator_last_name: head.creator_last_name,
      days,
    });
  } catch (err) {
    console.error("[GET /api/nutrition/plans/:id]", err);
    return res.status(500).json({ error: "Errore caricamento piano" });
  }
});

/**
 * PUT /api/nutrition/plans/:id
 * Aggiorna intestazione (expire, goal, notes)
 */
router.put("/:id", requireAuth, async (req, res) => {
  const user = (req as any).user as AuthUser;
  const isPro = user?.type === "professionista";
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "id non valido" });

  const { expire, goal, notes } = req.body || {};
  const safeGoal = ensureGoal(goal);
  if (!expire || !safeGoal) {
    return res.status(400).json({ error: "expire/goal non validi" });
  }

  try {
    // permesso
    const [rows] = await db.query(
      "SELECT customer_id, freelancer_id FROM nutrition_plans WHERE id = ? LIMIT 1",
      [id]
    );
    const plan = (rows as any[])[0];
    if (!plan) return res.status(404).json({ error: "Piano non trovato" });

    if (!isPro) {
      const myCid = await getCustomerIdByUserId(Number(user.id));
      if (!myCid || Number(plan.customer_id) !== myCid) {
        return res.status(403).json({ error: "Non autorizzato" });
      }
    } else {
      const myFid = await getFreelancerIdByUserId(Number(user.id));
      if (Number(plan.freelancer_id || 0) !== Number(myFid || -1)) {
        return res.status(403).json({ error: "Non autorizzato" });
      }
    }

    await db.query(
      "UPDATE nutrition_plans SET expire = ?, goal = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [expire, safeGoal, notes ?? null, id]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/nutrition/plans/:id]", err);
    return res.status(500).json({ error: "Errore aggiornamento piano" });
  }
});

/**
 * POST /api/nutrition/plans/:id/replace
 * Rimpiazza giorni/pasti/alimenti del piano (no fiber_g nel DB)
 * Body: { days: [{ day, meals: [{ position, name, notes, items: [{ position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g }] }]}] }
 */
router.post("/:id/replace", requireAuth, async (req, res) => {
  const user = (req as any).user as AuthUser;
  const isPro = user?.type === "professionista";
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "id non valido" });

  const payload = req.body || {};
  const days = Array.isArray(payload.days) ? payload.days : [];

  try {
    // permesso
    const [rows] = await db.query(
      "SELECT customer_id, freelancer_id FROM nutrition_plans WHERE id = ? LIMIT 1",
      [id]
    );
    const plan = (rows as any[])[0];
    if (!plan) return res.status(404).json({ error: "Piano non trovato" });

    if (!isPro) {
      const myCid = await getCustomerIdByUserId(Number(user.id));
      if (!myCid || Number(plan.customer_id) !== myCid) {
        return res.status(403).json({ error: "Non autorizzato" });
      }
    } else {
      const myFid = await getFreelancerIdByUserId(Number(user.id));
      if (Number(plan.freelancer_id || 0) !== Number(myFid || -1)) {
        return res.status(403).json({ error: "Non autorizzato" });
      }
    }

    // transazione: cancella e reinserisce
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // cancella a cascata (rispetta FK e UNIQUE)
      const [dayIdsRows] = await conn.query("SELECT id FROM nutrition_days WHERE plan_id = ?", [id]);
      const dayIds = (dayIdsRows as any[]).map((r) => r.id);
      if (dayIds.length) {
        const [mealIdsRows] = await conn.query(
          `SELECT id FROM nutrition_meals WHERE day_id IN (${dayIds.map(() => "?").join(",")})`,
          dayIds
        );
        const mealIds = (mealIdsRows as any[]).map((r) => r.id);
        if (mealIds.length) {
          await conn.query(
            `DELETE FROM nutrition_items WHERE meal_id IN (${mealIds.map(() => "?").join(",")})`,
            mealIds
          );
        }
        await conn.query(
          `DELETE FROM nutrition_meals WHERE day_id IN (${dayIds.map(() => "?").join(",")})`,
          dayIds
        );
        await conn.query("DELETE FROM nutrition_days WHERE plan_id = ?", [id]);
      }

      // reinserisci
      const dayIdMap = new Map<number, number>();
      for (const d of days) {
        const dayNum = Number(d?.day);
        if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 7) continue;
        const [r] = await conn.query(
          "INSERT INTO nutrition_days (plan_id, day) VALUES (?, ?)",
          [id, dayNum]
        );
        const insertedDayId = (r as any).insertId as number;
        dayIdMap.set(dayNum, insertedDayId);

        const meals = Array.isArray(d?.meals) ? d.meals : [];
        for (const m of meals) {
          const pos = Number(m?.position) || 1;
          const name = (m?.name ?? "Pasto").toString().slice(0, 80);
          const notes = m?.notes ?? null;

          const [mr] = await conn.query(
            "INSERT INTO nutrition_meals (day_id, position, name, notes) VALUES (?, ?, ?, ?)",
            [insertedDayId, pos, name, notes]
          );
          const mealId = (mr as any).insertId as number;

          const items = Array.isArray(m?.items) ? m.items : [];
          for (const it of items) {
            const ipos = Number(it?.position) || 1;
            const food_id = it?.food_id != null ? Number(it.food_id) : null;
            const description = it?.description ?? null;
            const qty = it?.qty != null ? Number(it.qty) : null;
            const unit = it?.unit ?? "g";
            const kcal = it?.kcal != null ? Number(it.kcal) : null;
            const protein_g = it?.protein_g != null ? Number(it.protein_g) : null;
            const carbs_g = it?.carbs_g != null ? Number(it.carbs_g) : null;
            const fat_g = it?.fat_g != null ? Number(it.fat_g) : null;

            await conn.query(
              `
              INSERT INTO nutrition_items
                (meal_id, position, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
              [mealId, ipos, food_id, description, qty, unit, kcal, protein_g, carbs_g, fat_g]
            );
          }
        }
      }

      await conn.commit();
      conn.release();
      return res.json({ ok: true });
    } catch (txErr) {
      await db.query("ROLLBACK");
      try { (await conn).release?.(); } catch {}
      console.error("[REPLACE tx rollback]", txErr);
      return res.status(500).json({ error: "Errore replace contenuti" });
    }
  } catch (err) {
    console.error("[POST /api/nutrition/plans/:id/replace]", err);
    return res.status(500).json({ error: "Errore replace piano" });
  }
});

export default router;
