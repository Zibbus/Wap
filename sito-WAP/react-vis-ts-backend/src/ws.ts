import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import pool from './db.js';

type AuthedWs = WebSocket & { userId?: number };

const clients = new Map<number, Set<AuthedWs>>(); // userId -> sockets

export function attachWs(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: AuthedWs, req) => {
    // Expect token in query: ws://host/ws?token=...
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token') || '';
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
      socket.userId = Number(payload.sub);
    } catch {
      socket.close(4001, 'unauthorized');
      return;
    }

    if (!clients.has(socket.userId!)) clients.set(socket.userId!, new Set());
    clients.get(socket.userId!)!.add(socket);

    socket.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        // { type: 'send', conversationId, body }
        if (msg?.type === 'send') {
          const { conversationId, body } = msg;
          if (typeof conversationId !== 'number' || typeof body !== 'string' || !body.trim()) return;
          const [result] = await pool.query(
            'INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)',
            [conversationId, socket.userId, body]
          );
          const messageId = (result as any).insertId;
          const [rows] = await pool.query('SELECT sender_id FROM conversation_participants WHERE conversation_id = ?', [conversationId]);
          const participants = Array.isArray(rows) ? rows.map(r => (r as any).sender_id || (r as any).user_id).map(Number) : [];

          const payload = JSON.stringify({ type: 'message', item: { id: messageId, conversation_id: conversationId, sender_id: socket.userId, body, created_at: new Date().toISOString() } });

          for (const uid of participants) {
            const set = clients.get(uid);
            if (set) {
              for (const s of set) {
                if (s.readyState === WebSocket.OPEN) s.send(payload);
              }
            }
          }
        }
      } catch (e) {
        console.error('ws error', e);
      }
    });

    socket.on('close', () => {
      const set = clients.get(socket.userId!);
      if (set) {
        set.delete(socket);
        if (set.size === 0) clients.delete(socket.userId!);
      }
    });
  });
}
