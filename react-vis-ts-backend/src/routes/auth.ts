import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db";

const router = express.Router();
const JWT_SECRET = "super-secret-key"; // meglio metterlo in .env

// 🟢 REGISTRAZIONE
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Dati mancanti" });

  try {
    const [existing] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
    if ((existing as any[]).length > 0)
      return res.status(409).json({ error: "Utente già registrato" });

    const hashed = await bcryptjs.hash(password, 10);
    await db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashed]);
    res.json({ message: "Registrazione completata" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore server" });
  }
});

// 🔵 LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Dati mancanti" });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    const user = (rows as any[])[0];
    if (!user) return res.status(401).json({ error: "Credenziali errate" });

    const match = await bcryptjs.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Credenziali errate" });

    const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, userId: user.id, username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore server" });
  }
});

export default router;
