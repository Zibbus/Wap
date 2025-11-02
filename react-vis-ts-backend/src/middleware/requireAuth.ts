// src/middleware/requireAuth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthUser = {
  id: number;
  username: string;
  type: "utente" | "professionista" | "admin";
};

/**
 * 👉 Augmentation di Express.Request: dice a TS che esiste req.user
 * Questo file viene compilato, quindi l'augmentation è visibile globalmente.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export default function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization || "";
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = m ? m[1] : "";

    if (!token) {
      return res.status(401).json({ error: "Token mancante" });
    }

    const SECRET = process.env.JWT_SECRET || "super-secret-key";
    const payload = jwt.verify(token, SECRET) as any;

    const id = Number(payload?.id ?? payload?.sub);
    const username = String(payload?.username ?? "");
    const type = (payload?.type as AuthUser["type"]) ?? "utente";

    if (!id || !username) {
      return res.status(401).json({ error: "Token non valido" });
    }

    req.user = { id, username, type }; // ✅ ora TS sa che esiste
    next();
  } catch {
    return res.status(401).json({ error: "Token non valido" });
  }
}
