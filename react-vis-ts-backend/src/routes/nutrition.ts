// src/routes/nutrition.ts
import express, { Request, Response } from "express";

const router = express.Router();

/**
 * STORAGE VOLATILE (solo per sbloccare il front-end).
 * Sostituiscilo con il tuo DB quando vuoi.
 */
let _planId = 1;
let _dayId = 1;
let _mealId = 1;

const Plans = new Map<number, {
  id: number;
  customer_id: number;
  expire: string;     // YYYY-MM-DD
  goal: string;
  notes: string | null;
}>();

const Days = new Map<number, {
  id: number;
  plan_id: number;
  day: number;        // 1..7
}>();

const Meals = new Map<number, {
  id: number;
  day_id: number;
  position: number;
  name: string;
  notes: string | null;
}>();

type ItemInput = {
  meal_id: number;
  position: number;
  food_id: number | null;
  description: string | null;
  qty: number | null;
  unit: "g"|"ml"|"pcs"|"cup"|"tbsp"|"tsp"|"slice";
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};
// opzionale: per completezza, li accettiamo ma non salviamo da nessuna parte
const Items: Array<ItemInput & { id: number }> = [];
let _itemId = 1;

/* ============ HELPERS ============ */
function required<T>(value: T | undefined | null, name: string): T {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Campo '${name}' obbligatorio`);
  }
  return value as T;
}

/* ============ ROUTES ============ */

/** CREA PIANO
 * body: { customer_id:number, expire:string(YYYY-MM-DD), goal:string, notes?:string|null }
 */
router.post("/plans", (req: Request, res: Response) => {
  try {
    const customer_id = Number(required(req.body?.customer_id, "customer_id"));
    const expire = String(required(req.body?.expire, "expire"));
    const goal = String(required(req.body?.goal, "goal"));
    const notes = (req.body?.notes ?? null) as string | null;

    const id = _planId++;
    const rec = { id, customer_id, expire, goal, notes };
    Plans.set(id, rec);

    return res.status(201).json(rec);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Bad request" });
  }
});

/** CREA GIORNO
 * body: { plan_id:number, day:1..7 }
 */
router.post("/days", (req: Request, res: Response) => {
  try {
    const plan_id = Number(required(req.body?.plan_id, "plan_id"));
    const day = Number(required(req.body?.day, "day"));

    if (!Plans.has(plan_id)) throw new Error("plan_id inesistente");
    if (!Number.isInteger(day) || day < 1 || day > 7) throw new Error("day deve essere 1..7");

    const id = _dayId++;
    const rec = { id, plan_id, day };
    Days.set(id, rec);

    return res.status(201).json(rec);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Bad request" });
  }
});

/** CREA PASTO
 * body: { day_id:number, position:number, name:string, notes?:string|null }
 */
router.post("/meals", (req: Request, res: Response) => {
  try {
    const day_id = Number(required(req.body?.day_id, "day_id"));
    const position = Number(required(req.body?.position, "position"));
    const name = String(required(req.body?.name, "name"));
    const notes = (req.body?.notes ?? null) as string | null;

    if (!Days.has(day_id)) throw new Error("day_id inesistente");

    const id = _mealId++;
    const rec = { id, day_id, position, name, notes };
    Meals.set(id, rec);

    return res.status(201).json(rec);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Bad request" });
  }
});

/** INSERIMENTO MASSIVO ALIMENTI
 * body: { items: ItemInput[] }
 */
router.post("/items/bulk", (req: Request, res: Response) => {
  try {
    const items = Array.isArray(req.body?.items) ? (req.body.items as ItemInput[]) : null;
    if (!items || !items.length) return res.json({ inserted: 0 });

    let inserted = 0;
    for (const it of items) {
      // validazioni minime
      if (!Meals.has(Number(it.meal_id))) continue;
      if (!it.unit) continue;

      Items.push({ ...it, id: _itemId++ });
      inserted++;
    }
    return res.json({ inserted });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Bad request" });
  }
});

/* --- opzionali: per debug veloce --- */
router.get("/_debug/state", (_req, res) => {
  res.json({
    plans: Array.from(Plans.values()),
    days: Array.from(Days.values()),
    meals: Array.from(Meals.values()),
    items: Items,
  });
});

export default router;
