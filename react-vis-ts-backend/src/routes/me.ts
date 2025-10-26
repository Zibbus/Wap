// routes/me.ts
import { Router } from "express";
import db from "../db";
import requireAuth from "../middleware/requireAuth"; // il tuo file sistemato

const router = Router();

/**
 * GET /api/me
 * Ritorna i dati del profilo loggato + eventuale customer (se utente) o freelancer (se professionista)
 */
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const [uRows] = await db.query(
      `SELECT id, username, email, first_name, last_name, sex, dob, type
       FROM users
       WHERE id = ? LIMIT 1`,
      [userId]
    );
    const user = (uRows as any[])[0];
    if (!user) return res.status(404).json({ error: "Utente non trovato" });

    let customer: any = null;
    let freelancer: any = null;

    if (user.type === "utente") {
      const [cRows] = await db.query(
        `SELECT id, weight, height FROM customers WHERE user_id = ? LIMIT 1`,
        [userId]
      );
      customer = (cRows as any[])[0] || null;
    } else if (user.type === "professionista") {
      const [fRows] = await db.query(
        `SELECT id, vat FROM freelancers WHERE user_id = ? LIMIT 1`,
        [userId]
      );
      freelancer = (fRows as any[])[0] || null;
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      type: user.type,               // "utente" | "professionista"
      first_name: user.first_name,
      last_name: user.last_name,
      sex: user.sex,
      dob: user.dob,
      customer,                      // { id, weight, height } | null
      freelancer,                    // { id, vat } | null
    });
  } catch (e) {
    console.error("[GET /api/me]", e);
    res.status(500).json({ error: "Errore server" });
  }
});

export default router;
