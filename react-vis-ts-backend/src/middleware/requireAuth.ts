import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthUser = {
  id: number;
  username: string;
  type: "utente" | "professionista" | "admin";
};

export default function requireAuth(
  req: Request & { user?: AuthUser },
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization || "";
    // supporta "Bearer", "bearer", ecc.
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match ? match[1] : "";

    if (!token) {
      return res.status(401).json({ error: "Token mancante" });
    }

    // ⚠️ usa lo stesso secret del login
    const SECRET = process.env.JWT_SECRET || "super-secret-key";

    const payload = jwt.verify(token, SECRET) as any;

    // Il login firma con { id, username, type } (nessun 'sub');
    // ma supportiamo anche 'sub' se in futuro lo usassi.
    const id = Number(payload?.id ?? payload?.sub);
    const username = String(payload?.username ?? "");
    const type = (payload?.type as AuthUser["type"]) ?? "utente";

    if (!id || !username) {
      return res.status(401).json({ error: "Token non valido" });
    }

    req.user = { id, username, type };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token non valido" });
  }
}
