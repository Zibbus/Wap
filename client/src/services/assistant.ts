import { api } from "./api";

export type AssistantMessage = {
  id: number;
  senderId: number;
  body: string;
  createdAt?: string;
};

export async function getAssistantThread() {
  return api.get<{
    threadId: number;
    botUserId: number;
    messages: AssistantMessage[];
  }>("/assistant/thread");
}

export async function sendAssistant(text: string) {
  return api.post<{
    threadId: number;
    reply: string;
    messageUser: AssistantMessage;
    messageBot: AssistantMessage;
  }>("/assistant/send", { text });
}