// react-vis-ts-backend/routes/customers.ts
import { Router } from "express";
import db from "../db";
import requireAuth from "../middleware/requireAuth";

const router = Router();

/**
 * GET /api/customers
 * Ritorna l'elenco dei customers con i dati necessari per i calcoli:
 * - customer_id, user_id
 * - username, email
 * - first_name, last_name
 * - sex, dob (per età)
 * - height (cm, da users.height)
 * - latest_weight (kg, dall'ultimo weight_history)
 *
 * Accesso: professionista o admin
 */
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const role = req.user?.type;
    if (role !== "professionista" && role !== "admin") {
      return res.status(403).json({ error: "Non autorizzato" });
    }

    const [rows] = await db.query(
      `
      SELECT
        c.id                                     AS customer_id,
        u.id                                     AS user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.sex,
        u.dob,
        u.height,
        (
          SELECT w.weight
          FROM weight_history w
          WHERE w.user_id = u.id
          ORDER BY w.measured_at DESC, w.id DESC
          LIMIT 1
        ) AS latest_weight
      FROM customers c
      JOIN users u ON u.id = c.user_id
      ORDER BY u.first_name IS NULL, u.first_name, u.last_name IS NULL, u.last_name, u.username
      `
    );

    return res.json(rows);
  } catch (err) {
    console.error("[GET /api/customers] err", err);
    return res.status(500).json({ error: "Errore server" });
  }
});

export default router;
