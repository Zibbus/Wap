// src/ws.ts
import type { Server as HttpServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket, RawData } from "ws";
import jwt from "jsonwebtoken";
import db from "./db";
import type { RowDataPacket } from "mysql2/promise";

type AuthedWs = WebSocket & { userId?: number };

/** userId -> set di socket */
const clients = new Map<number, Set<AuthedWs>>();

/** ===== Helpers usati dal router ===== */

/** Invia a tutti i socket di un utente */
export function pushToUser<T = any>(userId: number, type: string, payload: T) {
  const set = clients.get(userId);
  if (!set) return;
  const msg = JSON.stringify({ type, payload });
  for (const s of set) {
    if (s.readyState === WebSocket.OPEN) s.send(msg);
  }
}

/** Invia a tutti i partecipanti di un thread */
export async function pushToThread<T = any>(
  threadId: number,
  type: string,
  payload: T
) {
  const [rows] = await db.query<(RowDataPacket & { user_id: number })[]>(
    "SELECT user_id FROM chat_participants WHERE thread_id = ?",
    [threadId]
  );
  for (const r of rows || []) pushToUser(Number(r.user_id), type, payload);
}

/** Calcola unread (totale + per thread) e invia all’utente */
export async function pushUnreadToUser(userId: number) {
  const unread = await getUnreadForUser(userId);
  pushToUser(userId, "chat:unread:update", unread);
}

/** Calcolo unread riusato da pushUnreadToUser */
async function getUnreadForUser(userId: number): Promise<{ total: number; byThread: Record<number, number> }> {
  const [rows] = await db.query<(RowDataPacket & { threadId: number; unread: number })[]>(
    `
    SELECT
      t.id AS threadId,
      COUNT(m.id) AS unread
    FROM chat_threads t
    JOIN chat_participants cp
      ON cp.thread_id = t.id AND cp.user_id = ?
    LEFT JOIN chat_messages m
      ON m.thread_id = t.id
     AND m.id > COALESCE(cp.last_read_message_id, 0)
     AND m.sender_id <> ?
    GROUP BY t.id
    `,
    [userId, userId]
  );

  const byThread: Record<number, number> = {};
  let total = 0;
  for (const r of rows || []) {
    const n = Number(r.unread || 0);
    byThread[Number(r.threadId)] = n;
    total += n;
  }
  return { total, byThread };
}

/** Monta il WebSocket server */
export function attachWs(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket: AuthedWs, req: IncomingMessage) => {
    // token nella query: ws://host/ws?token=...
    const url = new URL(req.url || "", "http://internal");
    const token = url.searchParams.get("token") || "";

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as
        jwt.JwtPayload & { id?: number };
      if (!payload || typeof payload.id !== "number") throw new Error("bad jwt");
      socket.userId = payload.id;
    } catch {
      socket.close(4001, "unauthorized");
      return;
    }

    if (!clients.has(socket.userId!)) clients.set(socket.userId!, new Set());
    clients.get(socket.userId!)!.add(socket);

    socket.on("message", (data: RawData) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg?.type === "ping") {
          socket.send(JSON.stringify({ type: "pong", payload: Date.now() }));
        }
      } catch { /* ignore parse errors */ }
    });

    socket.on("close", () => {
      const set = clients.get(socket.userId!);
      if (!set) return;
      set.delete(socket);
      if (set.size === 0) clients.delete(socket.userId!);
    });
  });
}
