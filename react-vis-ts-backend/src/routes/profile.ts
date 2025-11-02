// backend/routes/profile.ts
import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import db from "../db";
import requireAuth from "../middleware/requireAuth";

const router = Router();

// ---- upload config
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname || ".png"));
  },
});
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ok = ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.mimetype);
  (cb as any)(ok ? null : new Error("Formato non supportato"), ok);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// helpers
const isNonEmpty = (v: any) => typeof v === "string" && v.trim() !== "";
const parseArray = (v: any): string[] => {
  if (Array.isArray(v)) return v.map(String).filter(isNonEmpty);
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.map(String).filter(isNonEmpty);
    } catch {
      return v.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};
const isLocalUploadUrl = (url?: string | null) => !!url && /\/uploads\/[^/]+$/.test(url);

// GET me
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const [uRows] = await db.query(
      `SELECT id, username, email, first_name, last_name, dob, sex, type
       FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    const user = (uRows as any[])[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    let professional = null;
    if (user.type === "professionista") {
      const [pRows] = await db.query(
        `SELECT pp.id, pp.freelancer_id, pp.display_name, pp.role, pp.city, pp.price_per_hour,
                pp.specialties, pp.languages, pp.bio, pp.avatar_url, pp.verified, pp.online,
                pp.rating, pp.reviews_count
           FROM professional_profiles pp
           JOIN freelancers f ON f.id = pp.freelancer_id
          WHERE f.user_id = ?
          LIMIT 1`,
        [userId]
      );
      const row = (pRows as any[])[0] || null;
      if (row) {
        try { row.specialties = JSON.parse(row.specialties || "[]"); } catch { row.specialties = []; }
        try { row.languages   = JSON.parse(row.languages   || "[]"); } catch { row.languages   = []; }
      }
      professional = row;
    }

    res.json({ user, professional });
  } catch (e) {
    console.error("[GET /profile]", e);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/profile — salva tutto (users + professional_profiles)
router.put("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName, lastName, email, dob, sex,
      displayName, role, city, pricePerHour, specialties, languages, bio,
    } = req.body || {};

    // users
    await db.query(
      `UPDATE users
          SET first_name=?, last_name=?, dob=?, sex=?, email=?
        WHERE id=?`,
      [
        isNonEmpty(firstName) ? firstName.trim() : null,
        isNonEmpty(lastName)  ? lastName.trim()  : null,
        isNonEmpty(dob)       ? dob             : null,   // YYYY-MM-DD
        isNonEmpty(sex)       ? sex             : null,
        isNonEmpty(email)     ? email.trim()    : null,
        userId,
      ]
    );

    // professional_profiles se professionista
    const [typeRows] = await db.query(`SELECT type FROM users WHERE id=?`, [userId]);
    const t = (typeRows as any[])[0]?.type;
    if (t === "professionista") {
      const [pRows] = await db.query(
        `SELECT pp.id FROM professional_profiles pp
          JOIN freelancers f ON f.id = pp.freelancer_id
         WHERE f.user_id = ? LIMIT 1`,
        [userId]
      );
      const prof = (pRows as any[])[0];
      if (prof) {
        const safeRole =
          role === "nutrizionista"
            ? "nutrizionista"
            : role === "personal_trainer"
            ? "personal_trainer"
            : undefined;

        await db.query(
          `UPDATE professional_profiles
              SET display_name   = COALESCE(?, display_name),
                  city           = ?,
                  price_per_hour = ?,
                  specialties    = ?,
                  languages      = ?,
                  bio            = ?,
                  role           = COALESCE(?, role)
            WHERE id = ?`,
          [
            isNonEmpty(displayName) ? displayName.trim() : null,
            isNonEmpty(city) ? city.trim() : null,
            typeof pricePerHour === "number" ? pricePerHour : null,
            JSON.stringify(parseArray(specialties)),
            JSON.stringify(parseArray(languages)),
            isNonEmpty(bio) ? bio.trim() : null,
            safeRole,
            prof.id,
          ]
        );
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("[PUT /profile]", e);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/profile/avatar — upload avatar (solo professionisti)
router.patch("/avatar", requireAuth, upload.single("avatar"), async (req: any, res) => {
  try {
    if (!req.file) return res.status(415).json({ error: "Formato non supportato (png/jpg/webp)" });

    const userId = req.user.id;
    const [pRows] = await db.query(
      `SELECT pp.id, pp.avatar_url
         FROM professional_profiles pp
         JOIN freelancers f ON f.id = pp.freelancer_id
        WHERE f.user_id = ?
        LIMIT 1`,
      [userId]
    );
    const prof = (pRows as any[])[0];
    if (!prof) return res.status(400).json({ error: "Profilo professionista non trovato" });

    const oldUrl = prof.avatar_url as string | null | undefined;

    // SALVA RELATIVO (meglio per il proxy /uploads di Vite)
    const newUrl = `/uploads/${req.file.filename}`;

    await db.query(`UPDATE professional_profiles SET avatar_url=? WHERE id=?`, [newUrl, prof.id]);

    // Prova a cancellare il vecchio file se era un upload locale
    if (isLocalUploadUrl(oldUrl)) {
      const fileName = oldUrl!.split("/uploads/")[1];
      if (fileName) {
        fs.promises.unlink(path.join(uploadsDir, fileName)).catch(() => {});
      }
    }

    res.json({ ok: true, avatarUrl: newUrl });
  } catch (e) {
    console.error("[PATCH /profile/avatar]", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;