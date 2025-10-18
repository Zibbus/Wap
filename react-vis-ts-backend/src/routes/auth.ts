import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db"; // mysql2/promise Pool

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// helpers
const isNonEmpty = (v: any) => typeof v === "string" && v.trim() !== "";
const normSex = (s?: string | null) => {
  if (!s) return null;
  const v = s.toUpperCase();
  return v === "M" || v === "F" || v === "O" ? v : null;
};
const normType = (t?: string | null) =>
  t === "professionista" ? "professionista" : "utente";

/**
 * POST /auth/register
 * Body richiesto:
 *  - username, email, password (obbligatori)
 *  - first_name?, last_name?, dob?('YYYY-MM-DD'), sex?('M'|'F'|'O'), type?('utente'|'professionista')
 *  - weight?, height?  (solo se type='utente')
 *  - vat?              (solo se type='professionista')
 */
router.post("/register", async (req, res) => {
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
  } = req.body || {};

  if (!isNonEmpty(username) || !isNonEmpty(email) || !isNonEmpty(password)) {
    return res.status(400).json({ error: "Username, email e password sono obbligatori" });
  }

  const finalType = normType(type);
  const finalSex = normSex(sex);

  try {
    // username già usato?
    const [uRows] = await db.query("SELECT id FROM users WHERE username = ?", [username.trim()]);
    if ((uRows as any[]).length > 0) {
      return res.status(409).json({ error: "Username già registrato" });
    }

    // email già usata?
    const [eRows] = await db.query("SELECT id FROM users WHERE email = ?", [email.trim()]);
    if ((eRows as any[]).length > 0) {
      return res.status(409).json({ error: "Email già registrata" });
    }

    const hashed = await bcryptjs.hash(password, 10);

    // usa transazione se disponibile
    const hasGetConnection = typeof (db as any).getConnection === "function";
    const conn = hasGetConnection ? await (db as any).getConnection() : (db as any);
    try {
      if (hasGetConnection) await conn.beginTransaction();

      // 1) inserisci in USERS
      const [result] = await conn.query(
        `
        INSERT INTO users
          (username, password, first_name, last_name, dob, sex, type, email)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          username.trim(),
          hashed,
          isNonEmpty(firstName) ? firstName.trim() : null,
          isNonEmpty(lastName) ? lastName.trim() : null,
          isNonEmpty(dob) ? dob : null, // 'YYYY-MM-DD' o null
          finalSex,                     // ENUM o null
          finalType,                    // 'utente' | 'professionista'
          email.trim(),
        ]
      );
      const userId = (result as any).insertId;

      // 2) profilo in base al type
      if (finalType === "utente") {
        await conn.query(
          `INSERT INTO customers (user_id, weight, height) VALUES (?, ?, ?)`,
          [
            userId,
            typeof weight === "number" ? weight : (isNonEmpty(weight) ? Number(weight) : null),
            typeof height === "number" ? height : (isNonEmpty(height) ? Number(height) : null),
          ]
        );
      } else {
        // professionista
        if (!isNonEmpty(vat)) {
          if (hasGetConnection) await conn.rollback();
          if (hasGetConnection) conn.release();
          return res.status(400).json({ error: "VAT è obbligatorio per i professionisti" });
        }
        await conn.query(
          `INSERT INTO freelancers (user_id, vat) VALUES (?, ?)`,
          [userId, (vat as string).trim()]
        );
      }

      if (hasGetConnection) {
        await conn.commit();
        conn.release();
      }

      return res.status(201).json({ message: "Registrazione completata", userId });
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

/**
 * POST /auth/login
 *  - usernameOrEmail, password
 *  Accetta username **o** email nello stesso campo.
 */
router.post("/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body || {};
  if (!isNonEmpty(usernameOrEmail) || !isNonEmpty(password)) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  try {
    const [rows] = await db.query(
      `SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1`,
      [usernameOrEmail.trim(), usernameOrEmail.trim()]
    );
    const user = (rows as any[])[0];
    if (!user) return res.status(401).json({ error: "Credenziali errate" });

    const ok = await bcryptjs.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Credenziali errate" });

    const token = jwt.sign(
      { id: user.id, username: user.username, type: user.type },
      JWT_SECRET,
      { expiresIn: "1d" }
    );  

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        type: user.type,
      },
    });
  } catch (err) {
    console.error("[login][err]", err);
    res.status(500).json({ error: "Errore server" });
  }
});

export default router;
