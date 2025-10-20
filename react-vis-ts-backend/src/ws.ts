import type { Server as HttpServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket, RawData } from "ws";
import jwt from "jsonwebtoken";
import pool from "./db.js";

type AuthedWs = WebSocket & { userId?: number };

/** Mappa connessioni attive: userId -> set di socket */
const clients = new Map<number, Set<AuthedWs>>();

export function attachWs(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket: AuthedWs, req: IncomingMessage) => {
    // Estrae token dalla query string: ws://host/ws?token=...
    const url = new URL(req.url || "", "http://localhost");
    const token = url.searchParams.get("token") || "";

    try {
      // Il tuo auth.ts firma così: { id, username, type }
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "dev-secret"
      ) as jwt.JwtPayload & { id?: number; username?: string; type?: string };

      if (!payload || typeof payload.id !== "number") {
        throw new Error("jwt payload missing id");
      }

      socket.userId = payload.id;
    } catch {
      socket.close(4001, "unauthorized");
      return;
    }

    // Registra la connessione nella mappa
    if (!clients.has(socket.userId!)) clients.set(socket.userId!, new Set());
    clients.get(socket.userId!)!.add(socket);

    socket.on("message", async (data: RawData) => {
      try {
        const msg = JSON.parse(data.toString());

        // Schema atteso: { type: 'send', conversationId: number, body: string }
        if (msg?.type === "send") {
          const { conversationId, body } = msg;
          if (
            typeof conversationId !== "number" ||
            typeof body !== "string" ||
            !body.trim()
          ) {
            return;
          }

          // Salva messaggio
          const [result] = await pool.query(
            "INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)",
            [conversationId, socket.userId, body]
          );
          const messageId = (result as any).insertId;

          // Recupera partecipanti della conversazione
          const [rows] = await pool.query(
            "SELECT sender_id, user_id FROM conversation_participants WHERE conversation_id = ?",
            [conversationId]
          );

          const participants: number[] = Array.isArray(rows)
            ? rows
                .map((r: any) =>
                  r.sender_id != null ? Number(r.sender_id) : Number(r.user_id)
                )
                .filter((n: number) => Number.isFinite(n))
            : [];

          // Payload verso i client
          const outgoing = JSON.stringify({
            type: "message",
            item: {
              id: messageId,
              conversation_id: conversationId,
              sender_id: socket.userId,
              body,
              created_at: new Date().toISOString(),
            },
          });

          // Broadcast ai partecipanti connessi
          for (const uid of participants) {
            const set = clients.get(uid);
            if (!set) continue;
            for (const s of set) {
              if (s.readyState === WebSocket.OPEN) {
                s.send(outgoing);
              }
            }
          }
        }
      } catch (e) {
        console.error("[ws][message] error:", e);
      }
    });

    socket.on("close", () => {
      const set = clients.get(socket.userId!);
      if (!set) return;
      set.delete(socket);
      if (set.size === 0) clients.delete(socket.userId!);
    });
  });
}
