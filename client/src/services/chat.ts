// client/src/services/chat.ts
import { api } from "./api";

// alias: openOrCreateConversation -> /api/chat/start
export async function openOrCreateConversation(toUserId: number): Promise<{ conversationId: number }> {
  // la nostra start crea/riutilizza il thread e ritorna { threadId }
  const res = await api.post<{ ok: true; threadId: number }>("/chat/start", { toUserId });
  return { conversationId: res.threadId };
}

// alias: sendMessage -> POST /api/chat/:id/messages
export async function sendMessage(conversationId: number, body: string): Promise<{ ok: true; id: number }> {
  return api.post(`/chat/${conversationId}/messages`, { body });
}

// (lista e messaggi)
export async function listConversations(): Promise<Array<{
  threadId: number;
  otherUserId: number;
  otherUsername: string;
  otherEmail: string | null;
  lastBody: string | null;
  lastAt: string | null;
}>> {
  return api.get("/chat/threads");
}

export async function getMessages(conversationId: number): Promise<Array<{
  id: number; senderId: number; body: string; createdAt: string;
}>> {
  return api.get(`/chat/${conversationId}/messages`);
}
