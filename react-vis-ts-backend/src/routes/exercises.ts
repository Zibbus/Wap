import { Router } from "express";
import db from "../db";

const router = Router();

/**
 * GET /api/exercises?groupIds=1&groupIds=3...
 * Ritorna esercizi filtrati per musclegroups_id
 */
router.get("/", async (req, res) => {
  try {
    const raw = req.query.groupIds;
    const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const ids = arr.map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0);
    if (!ids.length) return res.json([]);

    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await db.query(
      `SELECT id, title, musclegroups_id, weight_required
       FROM exercises
       WHERE musclegroups_id IN (${placeholders})
       ORDER BY musclegroups_id, title`,
      ids
    );
    res.json(rows);
  } catch (err) {
    console.error("[GET /api/exercises]", err);
    res.status(500).json({ error: "Errore lettura esercizi" });
  }
});

export default router;
