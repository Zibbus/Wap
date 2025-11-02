import { Router, Request, Response } from "express";
import requireAuth from "../middleware/requireAuth";
import db from "../db";
import type { RowDataPacket } from "mysql2";

const router = Router();

/**
 * GET /api/customers
 * - Se professionista: tutti i customers + dati utente
 * - Se utente: solo il proprio customer (se esiste)
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const me: any = (req as any).user || {};
    const isPro = me?.type === "professionista";

    if (isPro) {
      const sql = `
        SELECT
          c.id         AS id,
          c.user_id    AS user_id,
          u.username   AS username,
          u.first_name AS first_name,
          u.last_name  AS last_name,
          u.sex        AS sex,
          u.dob        AS dob,
          c.weight     AS weight,
          c.height     AS height
        FROM customers c
        JOIN users u ON u.id = c.user_id
        ORDER BY u.last_name IS NULL, u.last_name, u.first_name
      `;
      const [rows] = await db.query<RowDataPacket[]>(sql);
      return res.json(rows);
    }

    const sqlMine = `
      SELECT
        c.id, c.user_id, u.username, u.first_name, u.last_name, u.sex, u.dob,
        c.weight, c.height
      FROM customers c
      JOIN users u ON u.id = c.user_id
      WHERE c.user_id = ?
      LIMIT 1
    `;
    const [mine] = await db.query<RowDataPacket[]>(sqlMine, [me?.id]);
    return res.json(mine);
  } catch (err) {
    console.error("[GET /api/customers] error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
