import { api } from "./api";

export type ConversationPeer = { id: number; name: string; email: string | null };
export type ConversationSummary = {
  conversationId: number;
  lastMessageAt: string | null;
  lastMessage: { senderId: number; body: string } | null;
  peer: ConversationPeer;
};
export type Message = { id: number; senderId: number; body: string; createdAt: string };

export async function openOrCreateConversation(targetUserId: number) {
  return api.post<{ conversationId: number }>("/api/chat/conversations/open", { targetUserId });
}

export async function getConversations() {
  return api.get<ConversationSummary[]>("/api/chat/conversations");
}

export async function getMessages(conversationId: number, opts?: { before?: string; limit?: number }) {
  const q = new URLSearchParams();
  if (opts?.before) q.set("before", opts.before);
  if (opts?.limit) q.set("limit", String(opts.limit));
  return api.get<Message[]>(`/api/chat/conversations/${conversationId}/messages${q.toString() ? `?${q}` : ""}`);
}

export async function sendMessage(conversationId: number, body: string) {
  return api.post<Message>(`/api/chat/conversations/${conversationId}/messages`, { body });
}
