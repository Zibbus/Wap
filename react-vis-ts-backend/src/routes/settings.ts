import { Router } from "express";
import requireAuth from "../middleware/requireAuth";
import db from "../db";

const router = Router();

/**
 * GET /api/settings
 * - Legge user_settings.settings (JSON)
 * - Se non esiste riga o è NULL -> ritorna {}
 *   (il frontend farà merge con DEFAULTS)
 */
router.get("/", requireAuth, async (req: any, res) => {
  const userId = req.user.id;

  const [rows] = await db.query(
    `SELECT settings FROM user_settings WHERE user_id = ? LIMIT 1`,
    [userId]
  );

  const row = (rows as any[])[0];
  // In MySQL2, il campo JSON può arrivare come stringa o oggetto:
  const raw = row?.settings;
  const parsed =
    raw == null
      ? {}
      : (typeof raw === "string" ? safeParse(raw) ?? {} : raw);

  return res.json(parsed);
});

/**
 * PUT /api/settings
 * - Salva l'oggetto completo in user_settings.settings (JSON)
 * - Crea la riga se non esiste (upsert)
 * - Aggiorna alcune colonne “comode” (facoltative ma utili)
 */
router.put("/", requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const payload = req.body ?? {};

  // 1) upsert “vuoto” per garantire la riga
  await db.query(
    `INSERT INTO user_settings (user_id, settings)
     VALUES (?, JSON_OBJECT())
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    [userId]
  );

  // 2) salva l’oggetto completo in settings
  await db.query(
    `UPDATE user_settings
       SET settings = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [JSON.stringify(payload), userId]
  );

  // 3) (opzionale) sincronizza alcune colonne utili per query/filtri
  //    -> commenta se non ti servono
  await db.query(
    `UPDATE user_settings
        SET theme = ?,
            locale = ?,
            weight_unit = ?,
            height_unit = ?,
            distance_unit = ?,
            time_format = ?,
            currency = ?,
            energy_unit = ?,
            notifications = ?,
            privacy = ?,
            accessibility = ?,
            professional = ?,
            updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`,
    [
      payload.theme ?? "system",
      payload.language === "en" ? "en-US" : "it-IT",
      payload.units?.weight ?? "kg",
      payload.units?.height ?? "cm",
      payload.units?.distance ?? "km",
      payload.timeFormat ?? "24h",
      payload.currency ?? "EUR",
      payload.units?.energy ?? "kcal",
      JSON.stringify(payload.notifications ?? {}),
      JSON.stringify(payload.privacy ?? {}),
      JSON.stringify(payload.accessibility ?? {}),
      JSON.stringify(payload.professional ?? {}),
      userId,
    ]
  );

  return res.json({ ok: true });
});

// util
function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export default router;
