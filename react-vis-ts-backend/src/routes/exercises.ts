import { Router } from "express";
import pool from "../db.js";

export const exercisesRouter = Router();

/**
 * GET /api/exercises?groupIds=3&groupIds=6
 * (in alternativa accetta anche ?musclegroups_id=3&musclegroups_id=6)
 * Ritorna: [{ id, title, musclegroups_id }, ...]
 */
exercisesRouter.get("/", async (req, res) => {
  try {
    let raw = req.query.groupIds ?? req.query.musclegroups_id;
    if (!raw) return res.status(400).json({ error: "Missing groupIds" });

    const arr = Array.isArray(raw) ? raw : [raw];
    const ids = arr
      .map(v => parseInt(String(v), 10))
      .filter(n => Number.isInteger(n) && n > 0);

    if (!ids.length) return res.status(400).json({ error: "No valid groupIds" });

    // mysql2 espande IN (?) con array in modo sicuro
    const [rows] = await pool.query(
      `SELECT id, title, musclegroups_id
         FROM exercises
        WHERE musclegroups_id IN (?)
        ORDER BY title ASC`,
      [ids]
    );

    res.json(rows);
  } catch (err) {
    console.error("[/api/exercises] error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});