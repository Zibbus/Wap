import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthUser = { id: number; username: string; type: "utente" | "professionista" };

export default function requireAuth(
  req: Request & { user?: AuthUser },
  res: Response,
  next: NextFunction
) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Token mancante" });

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as any;
    // firmiamo con sub nel login
    const id = Number(payload.sub ?? payload.id);
    if (!id) return res.status(401).json({ error: "Token non valido" });

    req.user = { id, username: payload.username, type: payload.type };
    next();
  } catch {
    return res.status(401).json({ error: "Token non valido" });
  }
}