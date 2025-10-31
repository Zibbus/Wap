import { Router } from "express";
import db from "../db";

const router = Router();

/**
 * GET /api/exercises?groupIds=2,5
 * GET /api/exercises?groupIds=2&groupIds=5
 * Ritorna gli esercizi per i gruppi muscolari richiesti.
 */
router.get("/", async (req, res) => {
  try {
    const raw = req.query.groupIds; // può essere string o string[]

    // Normalizza in array di stringhe
    const parts: string[] = Array.isArray(raw)
      ? raw.flatMap((s) => String(s).split(",")) // supporta sia ["2","5"] che ["2,5"]
      : typeof raw === "string"
      ? raw.split(",")
      : [];

    // Converte in numeri, filtra non numerici e deduplica
    let ids = parts
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n) && n > 0);

    ids = Array.from(new Set(ids));

    if (!ids.length) {
      return res.status(400).json({ error: "Parametro groupIds mancante o non valido" });
    }

    const placeholders = ids.map(() => "?").join(",");

    const [rows] = await db.query(
      `
      SELECT id, title, musclegroups_id, weight_required
      FROM exercises
      WHERE musclegroups_id IN (${placeholders})
      ORDER BY musclegroups_id, title
      `,
      ids
    );

    // Risposta coerente con il front-end attuale
    const data = (rows as any[]).map((r) => ({
      id: r.id,
      title: r.title,
      musclegroups_id: r.musclegroups_id,
      weight_required: r.weight_required, // 'y'/'n'
    }));

    return res.json(data);
  } catch (err) {
    console.error("[GET /api/exercises] error:", err);
    return res.status(500).json({ error: "Errore lettura esercizi" });
  }
});

export default router;
