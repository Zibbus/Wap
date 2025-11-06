// client/src/services/chat.ts
import { api } from "./api";

/** Tipi utili da riusare in ChatPage ecc. */
export type ConversationListItem = {
  threadId: number;
  otherUserId: number;
  otherUsername: string;
  otherEmail: string | null;
  lastBody: string | null;
  lastAt: string | null;
};

export type ChatMessage = {
  id: number;
  senderId: number;
  body: string;
  createdAt: string;
};

// Apri/riusa via USERNAME (può anche inviare il primo messaggio)
export async function openOrCreateConversationByUsername(
  toUsername: string,
  text?: string
): Promise<{ conversationId: number }> {
  const payload = text ? { toUsername, text } : { toUsername };
  const res = await api.post<{ ok: true; threadId: number }>(
    "/chat/start-by-username",
    payload
  );
  return { conversationId: res.threadId };
}

// Apri/riusa via userId (fallback)
export async function openOrCreateConversation(
  toUserId: number
): Promise<{ conversationId: number }> {
  const res = await api.post<{ ok: true; threadId: number }>(
    "/chat/start",
    { toUserId }
  );
  return { conversationId: res.threadId };
}

// Invia messaggio (con trimming + guardia locale)
export async function sendMessage(
  conversationId: number,
  body: string
): Promise<{ ok: true; id: number }> {
  const text = body.trim();
  if (!text) throw new Error("Messaggio vuoto");
  return api.post<{ ok: true; id: number }>(
    `/chat/${conversationId}/messages`,
    { body: text }
  );
}

// Lista conversazioni (tipizzata)
export async function listConversations(): Promise<ConversationListItem[]> {
  return api.get<ConversationListItem[]>("/chat/threads");
}

// Messaggi della conversazione (tipizzati)
export async function getMessages(
  conversationId: number
): Promise<ChatMessage[]> {
  return api.get<ChatMessage[]>(`/chat/${conversationId}/messages`);
}
