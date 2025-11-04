// react-vis-ts-backend/routes/auth.ts
import type express from "express";
import expressLib from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db";

import multer from "multer";
import path from "path";
import fs from "fs";

const router = expressLib.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

/* -------------------------- Helpers -------------------------- */
const isNonEmpty = (v: any) => typeof v === "string" && v.trim() !== "";
const normSex = (s?: string | null) => {
  if (!s) return null;
  const v = s.toUpperCase();
  return v === "M" || v === "F" || v === "O" ? v : null;
};
const normType = (t?: string | null) =>
  t === "professionista" ? "professionista" : "utente";

// specialties/languages possono arrivare come array o string (da multipart):
function parseArrayField(v: any): string[] {
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
}

/* --------------------- Multer (upload avatar) --------------------- */
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (_req: express.Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadsDir);
  },
  filename: (_req: express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname || ".png"));
  },
});

// ✅ usa il tipo indicizzato di multer, rifiuta i formati non supportati senza lanciare Error
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ok =
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/webp";

  // 1° argomento: null (niente errore tipizzato)
  // 2° argomento: true = accetta, false = rifiuta
  cb(null, ok);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ---------------------- REGISTER (con avatar) ---------------------- */
/**
 * POST /api/auth/register
 * Accetta:
 *  - multipart/form-data con campo file "avatar" (opzionale)
 *  - oppure application/json con "avatarUrl" (opzionale)
 */
router.post("/register", upload.single("avatar"), async (req, res) => {
  const uploadedFile = req.file as Express.Multer.File | undefined;
  const avatarFromFile = uploadedFile
    ? `${req.protocol}://${req.get("host")}/uploads/${uploadedFile.filename}`
    : null;

  const {
    username,
    email,
    password,
    firstName,
    lastName,
    dob,
    sex,
    type,
    weight,
    height,
    vat,

    // opzionali per profilo ricco
    role,           // "personal_trainer" | "nutrizionista"
    city,
    pricePerHour,
    specialties,    // array o string
    languages,      // array o string
    bio,
    avatarUrl,      // URL alternativo se non si carica file
  } = req.body || {};

  if (!isNonEmpty(username) || !isNonEmpty(email) || !isNonEmpty(password)) {
    return res.status(400).json({ error: "Username, email e password sono obbligatori" });
  }

  const finalType = normType(type);
  const finalSex = normSex(sex);
  const finalSpecialties = parseArrayField(specialties);
  const finalLanguages = parseArrayField(languages);
  const finalAvatar = avatarFromFile || (isNonEmpty(avatarUrl) ? avatarUrl.trim() : null);

  try {
    // 1) Esistenza username/email
    const [uRows] = await db.query("SELECT id FROM users WHERE username = ?", [username.trim()]);
    if ((uRows as any[]).length > 0) {
      return res.status(409).json({ error: "Username già registrato" });
    }

    const [eRows] = await db.query("SELECT id FROM users WHERE email = ?", [email.trim()]);
    if ((eRows as any[]).length > 0) {
      return res.status(409).json({ error: "Email già registrata" });
    }

    const hashed = await bcryptjs.hash(password, 10);

    // 2) Transazione
    const hasGetConnection = typeof (db as any).getConnection === "function";
    const conn = hasGetConnection ? await (db as any).getConnection() : (db as any);

    try {
      if (hasGetConnection) await conn.beginTransaction();
      const heightValue =
        typeof height === "number" ? height :
        (isNonEmpty(height) ? Number(height) : null);

      const [result] = await conn.query(
        `
        INSERT INTO users
          (username, password, first_name, last_name, dob, sex, type, email, height)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          username.trim(),
          hashed,
          isNonEmpty(firstName) ? firstName.trim() : null,
          isNonEmpty(lastName) ? lastName.trim() : null,
          isNonEmpty(dob) ? dob : null,
          finalSex,
          finalType,
          email.trim(),
          heightValue,
        ]
      );
      const userId = (result as any).insertId;
      // 2b) Profili
      if (finalType === "utente") {

        await conn.query(
          `INSERT INTO customers (user_id) VALUES (?)`,
          [userId]
        );

        // opzionale: salva il peso iniziale nello storico (se fornito)
        const initialWeight =
          typeof weight === "number" ? weight :
          (isNonEmpty(weight) ? Number(weight) : null);

        if (initialWeight != null && Number.isFinite(initialWeight)) {
          await conn.query(
            `INSERT INTO weight_history (user_id, weight, measured_at)
            VALUES (?, ?, NOW())`,
            [userId, initialWeight]
          );
        }
      } else {
        // professionista
        if (!isNonEmpty(vat)) {
          if (hasGetConnection) await conn.rollback();
          if (hasGetConnection) conn.release();
          return res.status(400).json({ error: "VAT obbligatorio per professionisti" });
        }

        // freelancers
        const [fRes] = await conn.query(
          `INSERT INTO freelancers (user_id, vat) VALUES (?, ?)`,
          [userId, String(vat).trim()]
        );
        const freelancerId = (fRes as any).insertId;

        // professional_profiles
        const displayName = `${firstName ?? ""} ${lastName ?? ""}`.trim() || username.trim();
        const safeRole = role === "nutrizionista" ? "nutrizionista" : "personal_trainer";

        await conn.query(
          `INSERT INTO professional_profiles
             (freelancer_id, display_name, role, city, price_per_hour, specialties, languages, bio, avatar_url, verified, online, rating, reviews_count)
           VALUES
             (?,            ?,            ?,    ?,    ?,             ?,           ?,         ?,   ?,         ?,        ?,      ?,             ?)`,
          [
            freelancerId,
            displayName,
            safeRole,
            isNonEmpty(city) ? city.trim() : null,
            typeof pricePerHour === "number" ? pricePerHour : 0,
            JSON.stringify(finalSpecialties),
            JSON.stringify(finalLanguages),
            isNonEmpty(bio) ? bio.trim() : null,
            finalAvatar,
            0, // verified
            0, // online
            0, // rating
            0, // reviews_count
          ]
        );
      }

      if (hasGetConnection) {
        await conn.commit();
        conn.release();
      }

      return res.status(201).json({
        message: "Registrazione completata",
        userId,
        role: finalType,
      });
    } catch (txErr: any) {
      console.error("[register][txErr]", txErr?.sqlMessage || txErr);
      if (hasGetConnection) {
        try { await conn.rollback(); } catch {}
        try { conn.release(); } catch {}
      }
      return res.status(500).json({ error: "Errore durante la registrazione" });
    }
  } catch (err) {
    console.error("[register][err]", err);
    return res.status(500).json({ error: "Errore server" });
  }
});

/* --------------------------- LOGIN --------------------------- */
/**
 * POST /api/auth/login
 * Body: { usernameOrEmail, password }
 * Restituisce: token + user{...} (incluso avatarUrl)
 */
router.post("/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body || {};
  if (!isNonEmpty(usernameOrEmail) || !isNonEmpty(password)) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  try {
    // 👇 Aggiungo avatar_url alla SELECT
    const [rows] = await db.query(
      `SELECT id, username, email, password, first_name, last_name, sex, dob, type, avatar_url
         FROM users
        WHERE username = ? OR email = ?
        LIMIT 1`,
      [usernameOrEmail.trim(), usernameOrEmail.trim()]
    );
    const user = (rows as any[])[0];
    if (!user) return res.status(401).json({ error: "Credenziali errate" });

    const ok = await bcryptjs.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Credenziali errate" });

    let customer: any = null;
    let freelancer: any = null;

    if (user.type === "utente") {
      const [cRows] = await db.query(
        `SELECT id FROM customers WHERE user_id = ? LIMIT 1`,
        [user.id]
      );
      customer = (cRows as any[])[0] || null;
    } else if (user.type === "professionista") {
      const [fRows] = await db.query(
        `SELECT id FROM freelancers WHERE user_id = ? LIMIT 1`,
        [user.id]
      );
      freelancer = (fRows as any[])[0] || null;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, type: user.type },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 👇 Rimando avatarUrl così il frontend può mostrarlo subito (header “Ciao, …”)
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        type: user.type,
        sex: user.sex,
        dob: user.dob,
        avatarUrl: user.avatar_url ?? null,  // <= aggiunto
        customer: customer ? { id: customer.id } : null,
        freelancer: freelancer ? { id: freelancer.id } : null,
      },
    });
  } catch (err) {
    console.error("[login][err]", err);
    res.status(500).json({ error: "Errore server" });
  }
});
export default router;