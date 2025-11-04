// routes/me.ts
import { Router } from "express";
import db from "../db";
import requireAuth from "../middleware/requireAuth";

const router = Router();

const WEIGHTS_TABLE = "weight_history";
const WEIGHT_COLUMN = "weight";

router.get("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // users: includi height spostata qui
    const [uRows] = await db.query(
      `SELECT id, username, email, first_name, last_name, sex, dob, type, height
       FROM users
       WHERE id = ? LIMIT 1`,
      [userId]
    );
    const user = (uRows as any[])[0];
    if (!user) return res.status(404).json({ error: "Utente non trovato" });

    // customer: ora non ha più weight/height, tieni solo id (se esiste)
    let customer: any = null;
    if (user.type === "utente") {
      const [cRows] = await db.query(
        `SELECT id FROM customers WHERE user_id = ? LIMIT 1`,
        [userId]
      );
      customer = (cRows as any[])[0] || null;
    }

    // freelancer come prima
    let freelancer: any = null;
    if (user.type === "professionista") {
      const [fRows] = await db.query(
        `SELECT id, vat FROM freelancers WHERE user_id = ? LIMIT 1`,
        [userId]
      );
      freelancer = (fRows as any[])[0] || null;
    }

    // ultimo peso dallo storico
    // NB: se la tabella/colonna ha un nome diverso, vedi le costanti sopra
    let latest_weight: number | null = null;
    try {
      const [wRows] = await db.query(
        `SELECT ${WEIGHT_COLUMN} AS value
           FROM ${WEIGHTS_TABLE}
          WHERE user_id = ?
          ORDER BY measured_at DESC, id DESC
          LIMIT 1`,
        [userId]
      );
      latest_weight = (wRows as any[])[0]?.value ?? null;
    } catch (e) {
      // se la tabella non esiste ancora, ignora: latest_weight resta null
      console.warn(`[GET /api/me] tabella pesi mancante/ diversa: ${WEIGHTS_TABLE}`, e);
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
      height: user.height,           // <- ora qui
      latest_weight,                 // <- peso più recente (o null)
      customer,                      // { id } | null
      freelancer,                    // { id, vat } | null
    });
  } catch (e) {
    console.error("[GET /api/me]", e);
    res.status(500).json({ error: "Errore server" });
  }
});

export default router;
