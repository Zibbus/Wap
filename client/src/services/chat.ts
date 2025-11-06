// client/src/services/chat.ts
import { api } from "./api";

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
  attachmentUrl?: string | null;
  attachmentMime?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
};

// ✅ username + opzionale primo messaggio
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

// fallback by userId
export async function openOrCreateConversation(
  toUserId: number
): Promise<{ conversationId: number }> {
  const res = await api.post<{ ok: true; threadId: number }>(
    "/chat/start",
    { toUserId }
  );
  return { conversationId: res.threadId };
}

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

export async function uploadAttachment(
  conversationId: number,
  file: File,
  text?: string
): Promise<{ ok: true; message: ChatMessage }> {
  const form = new FormData();
  form.append("file", file);
  if (text && text.trim()) form.append("text", text.trim());

  // ✅ recupero token come fa useAuth/localStorage
  let token: string | null = null;
  try {
    const saved = localStorage.getItem("authData");
    if (saved) token = JSON.parse(saved)?.token ?? null;
  } catch {}

  const base = (import.meta as any).env?.VITE_API_BASE ?? "/api";
  const res = await fetch(`${base}/chat/${conversationId}/attachments`, {
    method: "POST",
    // ✅ se usi cookie di sessione, resta include; se usi solo JWT va bene lo stesso
    credentials: "include",
    // ✅ aggiungi Authorization se presente
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    // Rilancia un errore con il messaggio reale del backend
    throw new Error(txt || `HTTP ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function listConversations(): Promise<ConversationListItem[]> {
  return api.get("/chat/threads");
}

export async function getMessages(
  conversationId: number
): Promise<ChatMessage[]> {
  return api.get(`/chat/${conversationId}/messages`);
}
