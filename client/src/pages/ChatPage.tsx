// client/src/pages/ChatPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getConversations,
  getMessages,
  sendMessage,
  type ConversationSummary,
  type Message,
} from "../services/chat";
import { useAuth } from "../hooks/useAuth";

export default function ChatPage() {
  const { authData } = useAuth();
  const myId = authData?.userId ?? null;

  const [convs, setConvs] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await getConversations();
        setConvs(list);
        if (list[0]) setActiveId(list[0].conversationId);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const msgs = await getMessages(activeId);
      setMessages(msgs);
    })();
  }, [activeId]);

  async function onSend() {
    if (!activeId || !draft.trim()) return;
    setSending(true);
    try {
      const msg = await sendMessage(activeId, draft.trim());
      setMessages((prev) => [...prev, msg]);
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  const activePeer = useMemo(
    () => convs.find((c) => c.conversationId === activeId)?.peer,
    [convs, activeId]
  );

  if (loading) {
    return <div className="mx-auto max-w-5xl px-6 py-12">Caricamento…</div>;
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-8 md:grid-cols-12">
      {/* Lista conversazioni */}
      <aside className="rounded-2xl border border-indigo-50 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 md:col-span-4">
        <h2 className="mb-2 px-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Le mie chat</h2>
        <ul className="space-y-1">
          {convs.map((c) => (
            <li key={c.conversationId}>
              <button
                onClick={() => setActiveId(c.conversationId)}
                className={`w-full rounded-xl px-3 py-2 text-left transition
                  ${activeId === c.conversationId
                    ? "bg-indigo-50 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <div className="text-sm font-medium">{c.peer.name}</div>
                <div className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                  {c.lastMessage ? c.lastMessage.body : "Nessun messaggio"}
                </div>
              </button>
            </li>
          ))}
          {convs.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Nessuna conversazione.</li>
          )}
        </ul>
      </aside>

      {/* Finestra messaggi */}
      <section className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-indigo-50 bg-white dark:border-gray-800 dark:bg-gray-900 md:col-span-8">
        <header className="border-b border-gray-100 p-3 dark:border-gray-800">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {activePeer ? activePeer.name : "Seleziona una chat"}
          </div>
          {activePeer?.email && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{activePeer.email}</div>
          )}
        </header>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {messages.map((m) => {
            const mine = myId != null && m.senderId === myId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm
                  ${mine ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"}`}>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                  <div className={`mt-1 text-[11px] opacity-70 ${mine ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="pt-8 text-center text-sm text-gray-500 dark:text-gray-400">Scrivi il primo messaggio…</div>
          )}
        </div>

        <footer className="border-t border-gray-100 p-3 dark:border-gray-800">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
              placeholder="Scrivi un messaggio…"
              className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <button
              onClick={onSend}
              disabled={!draft.trim() || sending || !activeId}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Invia
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
