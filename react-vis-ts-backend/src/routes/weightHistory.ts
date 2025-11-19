// src/routes/weightHistory.ts
import { Router, type Request, type Response } from "express";
import db from "../db";
import requireAuth, { type AuthUser } from "../middleware/requireAuth";

const router = Router();

type AuthRequest = Request & { user?: AuthUser };

type WeightRow = {
  id: number;
  user_id: number;
  weight: number;
  measured_at: string;
};

/**
 * GET /api/weight-history
 * Lista delle misurazioni dell'utente loggato
 */
router.get(
  "/",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      const [rows] = await db.query(
        `SELECT id, user_id, weight, measured_at
         FROM weight_history
         WHERE user_id = ?
         ORDER BY measured_at ASC, id ASC`,
        [userId]
      );

      res.json(rows as WeightRow[]);
    } catch (err) {
      console.error("[GET /api/weight-history] error", err);
      res
        .status(500)
        .json({ message: "Errore nel caricamento delle misurazioni" });
    }
  }
);

/**
 * POST /api/weight-history
 * Crea una nuova misurazione (peso attuale, data = NOW)
 * body: { weight: number }
 */
router.post(
  "/",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const rawWeight = req.body?.weight;

      const weight = Number(rawWeight);
      if (!Number.isFinite(weight) || weight <= 0) {
        return res
          .status(400)
          .json({ message: "Peso non valido" });
      }

      const [result] = await db.query(
        `INSERT INTO weight_history (user_id, weight, measured_at)
         VALUES (?, ?, NOW())`,
        [userId, weight]
      );

      const insertId = (result as any).insertId as number;

      const [rows] = await db.query(
        `SELECT id, user_id, weight, measured_at
         FROM weight_history
         WHERE id = ? AND user_id = ?
         LIMIT 1`,
        [insertId, userId]
      );

      const created = (rows as WeightRow[])[0];
      res.status(201).json(created);
    } catch (err) {
      console.error("[POST /api/weight-history] error", err);
      res
        .status(500)
        .json({ message: "Errore nel salvataggio del peso" });
    }
  }
);

/**
 * PUT /api/weight-history/:id
 * Modifica il peso di una misurazione esistente dell'utente.
 * body: { weight: number }
 */
router.put(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const id = Number(req.params.id);
      const rawWeight = req.body?.weight;

      if (!Number.isFinite(id) || id <= 0) {
        return res
          .status(400)
          .json({ message: "ID misurazione non valido" });
      }

      const weight = Number(rawWeight);
      if (!Number.isFinite(weight) || weight <= 0) {
        return res
          .status(400)
          .json({ message: "Peso non valido" });
      }

      const [existingRows] = await db.query(
        `SELECT id, user_id, weight, measured_at
         FROM weight_history
         WHERE id = ? AND user_id = ?
         LIMIT 1`,
        [id, userId]
      );

      const existing = (existingRows as WeightRow[])[0];
      if (!existing) {
        return res
          .status(404)
          .json({ message: "Misurazione non trovata" });
      }

      await db.query(
        `UPDATE weight_history
         SET weight = ?
         WHERE id = ? AND user_id = ?`,
        [weight, id, userId]
      );

      const [rows] = await db.query(
        `SELECT id, user_id, weight, measured_at
         FROM weight_history
         WHERE id = ? AND user_id = ?
         LIMIT 1`,
        [id, userId]
      );

      const updated = (rows as WeightRow[])[0];
      res.json(updated);
    } catch (err) {
      console.error("[PUT /api/weight-history/:id] error", err);
      res
        .status(500)
        .json({ message: "Errore nella modifica della misurazione" });
    }
  }
);

/**
 * DELETE /api/weight-history/:id
 * Elimina una misurazione dell'utente loggato
 */
router.delete(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const id = Number(req.params.id);

      if (!Number.isFinite(id) || id <= 0) {
        return res
          .status(400)
          .json({ message: "ID misurazione non valido" });
      }

      const [result] = await db.query(
        `DELETE FROM weight_history
         WHERE id = ? AND user_id = ?`,
        [id, userId]
      );

      const affected = (result as any).affectedRows as number;
      if (!affected) {
        return res
          .status(404)
          .json({ message: "Misurazione non trovata" });
      }

      res.status(204).send();
    } catch (err) {
      console.error("[DELETE /api/weight-history/:id] error", err);
      res
        .status(500)
        .json({ message: "Errore nell'eliminazione della misurazione" });
    }
  }
);

export default router;
