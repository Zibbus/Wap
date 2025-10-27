import { Router } from "express";
import db from "../db";
// se vuoi protetta, importa requireAuth e mettila come middleware

const router = Router();

/**
 * GET /api/foods
 * Query params:
 *  - query?: string (filtra per nome, LIKE %query%)
 *  - limit?: number (default 20, max 50)
 */
router.get("/", async (req, res) => {
  try {
    const q = (req.query.query as string | undefined)?.trim() ?? "";
    const limitRaw = Number(req.query.limit ?? 20);
    const limit = Math.min(Math.max(limitRaw || 20, 1), 50);

    if (q) {
      const [rows] = await db.query(
        `SELECT id, name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100
         FROM foods
         WHERE name LIKE ?
         ORDER BY name ASC
         LIMIT ?`,
        [`%${q}%`, limit]
      );
      return res.json(rows);
    } else {
      const [rows] = await db.query(
        `SELECT id, name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100
         FROM foods
         ORDER BY name ASC
         LIMIT ?`,
        [limit]
      );
      return res.json(rows);
    }
  } catch (e) {
    console.error("[GET /api/foods]", e);
    res.status(500).json({ error: "Errore server" });
  }
});

/**
 * (Opzionale) GET /api/foods/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "id non valido" });
    const [rows] = await db.query(
      `SELECT id, name, default_unit, kcal_per_100, protein_per_100, carbs_per_100, fat_per_100
       FROM foods WHERE id = ? LIMIT 1`,
      [id]
    );
    const food = (rows as any[])[0] || null;
    if (!food) return res.status(404).json({ error: "Alimento non trovato" });
    res.json(food);
  } catch (e) {
    console.error("[GET /api/foods/:id]", e);
    res.status(500).json({ error: "Errore server" });
  }
});

export default router;
