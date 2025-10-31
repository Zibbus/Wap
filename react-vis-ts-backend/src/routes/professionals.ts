// react-vis-ts-backend/routes/professionals.ts
import { Router } from "express";
import pool from "../db";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

/* --- Multer setup (solo immagini) --- */
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname || ".png"));
  },
});
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ok =
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/webp";
  cb(null, ok); // rifiuta formati non supportati senza lanciare Error
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

/* --- GET /api/professionals --- */
router.get("/", async (req, res) => {
  try {
    const { q, role, onlineOnly, minRating, maxPrice } = req.query as Record<string, string | undefined>;
    const where: string[] = [];
    const params: any[] = [];

    if (role && role !== "all") { where.push("pp.role = ?"); params.push(role); }
    if (onlineOnly === "1") { where.push("pp.online = 1"); }
    if (minRating !== undefined) {
      const v = Number(minRating); if (!Number.isNaN(v)) { where.push("pp.rating >= ?"); params.push(v); }
    }
    if (maxPrice !== undefined && maxPrice !== "") {
      const v = Number(maxPrice); if (!Number.isNaN(v)) { where.push("pp.price_per_hour <= ?"); params.push(v); }
    }
    if (q && q.trim()) {
      const needle = `%${q.trim().toLowerCase()}%`;
      where.push(
        "(LOWER(pp.display_name) LIKE ? OR LOWER(pp.city) LIKE ? OR " +
        "JSON_SEARCH(pp.specialties, 'all', ?) IS NOT NULL OR " +
        "JSON_SEARCH(pp.languages, 'all', ?) IS NOT NULL)"
      );
      params.push(needle, needle, q.trim(), q.trim());
    }

    const sql = `
      SELECT
        pp.id, u.id AS user_id, u.username,
        pp.display_name AS name, pp.role, pp.online, pp.rating, pp.reviews_count,
        pp.price_per_hour, pp.city, pp.specialties, pp.languages,
        pp.verified, pp.avatar_url, pp.bio
      FROM professional_profiles pp
      JOIN freelancers f ON f.id = pp.freelancer_id
      JOIN users u ON u.id = f.user_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY pp.verified DESC, pp.rating DESC, pp.price_per_hour ASC
      LIMIT 100
    `;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("GET /api/professionals error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* --- GET /api/professionals/:id --- */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const sql = `
      SELECT
        pp.id, u.id AS user_id, u.username,
        pp.display_name AS name, pp.role, pp.online, pp.rating, pp.reviews_count,
        pp.price_per_hour, pp.city, pp.specialties, pp.languages,
        pp.verified, pp.avatar_url, pp.bio
      FROM professional_profiles pp
      JOIN freelancers f ON f.id = pp.freelancer_id
      JOIN users u ON u.id = f.user_id
      WHERE pp.id = ?
      LIMIT 1
    `;
    const [rows]: any[] = await pool.query(sql, [id]);
    if (!(rows as any[]).length) return res.status(404).json({ error: "Not found" });
    res.json((rows as any[])[0]);
  } catch (err) {
    console.error("GET /api/professionals/:id error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* --- POST /api/professionals/:id/avatar --- */
router.post("/:id/avatar", upload.single("file"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "id invalido" });

    if (!req.file) {
      return res.status(415).json({ error: "Formato non supportato (usa png, jpg, jpeg, webp)" });
    }

    const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    await pool.query("UPDATE professional_profiles SET avatar_url = ? WHERE id = ?", [url, id]);
    res.json({ ok: true, avatarUrl: url });
  } catch (err) {
    console.error("POST /api/professionals/:id/avatar error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;