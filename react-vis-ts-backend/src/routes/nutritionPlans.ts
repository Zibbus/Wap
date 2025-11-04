// routes/nutrition_plans.ts
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
        COALESCE(CONCAT(u.first_name,' ',u.last_name), u.username, u.email, CONCAT('user#',u.id)) AS creator,
        (SELECT COUNT(*) FROM nutrition_days nd WHERE nd.plan_id = np.id) AS days_count
      FROM nutrition_plans np
      LEFT JOIN freelancers f ON f.id = np.freelancer_id
      LEFT JOIN users u ON u.id = f.user_id
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
        COALESCE(CONCAT(u.first_name,' ',u.last_name), u.username, u.email, CONCAT('user#',u.id)) AS creator
      FROM nutrition_plans np
      LEFT JOIN freelancers f ON f.id = np.freelancer_id
      LEFT JOIN users u ON u.id = f.user_id
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
      days,
    });
  } catch (err) {
    console.error("[GET /api/nutrition/plans/:id]", err);
    return res.status(500).json({ error: "Errore caricamento piano" });
  }
});

export default router;
