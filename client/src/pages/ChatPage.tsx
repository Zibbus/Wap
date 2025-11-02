// client/src/pages/ChatPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  listConversations, // dal tuo services/chat.ts
  getMessages,
  sendMessage,
} from "../services/chat";
import { useAuth } from "../hooks/useAuth";

// Tipi locali, allineati al payload di services/chat.ts
type ConversationSummary = {
  conversationId: number;
  peer: { userId: number; name: string };
  lastBody: string | null;
  lastAt: string | null;
};

type Message = {
  id: number;
  senderId: number;
  body: string;
  createdAt: string;
};

export default function ChatPage() {
  const { authData } = useAuth();
  const myId = authData?.userId ?? null;

  // supporta navigate('/chat', { state: { conversationId } })
  const location = useLocation() as { state?: { conversationId?: number } };
  const requestedId = location.state?.conversationId ?? null;

  const [convs, setConvs] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Carica e mappa le conversazioni
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const raw = await listConversations();
        // raw: { threadId, otherUserId, otherUsername, otherEmail, lastBody, lastAt }
        const list: ConversationSummary[] = raw.map((c: {
          threadId: number;
          otherUserId: number;
          otherUsername: string;
          otherEmail: string | null;
          lastBody: string | null;
          lastAt: string | null;
        }) => ({
          conversationId: c.threadId,
          peer: { userId: c.otherUserId, name: c.otherUsername },
          lastBody: c.lastBody,
          lastAt: c.lastAt,
        }));

        setConvs(list);

        if (requestedId && list.some((c) => c.conversationId === requestedId)) {
          setActiveId(requestedId);
        } else if (list[0]) {
          setActiveId(list[0].conversationId);
        } else {
          setActiveId(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [requestedId]);

  // Carica messaggi della conversazione attiva
  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const msgs = await getMessages(activeId);
      setMessages(msgs as Message[]);
    })();
  }, [activeId]);

  async function onSend() {
    if (!activeId || !draft.trim()) return;
    try {
      setSending(true);
      const text = draft.trim();
      setDraft("");
      await sendMessage(activeId, text);
      const msgs = await getMessages(activeId);
      setMessages(msgs as Message[]);
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
        <h2 className="mb-2 px-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Conversazioni</h2>
        <ul className="space-y-1">
          {convs.map((c: ConversationSummary) => (
            <li key={c.conversationId}>
              <button
                type="button"
                onClick={() => setActiveId(c.conversationId)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  activeId === c.conversationId ? "bg-gray-50 dark:bg-gray-800" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{c.peer.name}</span>
                  {c.lastAt && (
                    <time className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(c.lastAt).toLocaleString("it-IT")}
                    </time>
                  )}
                </div>
                <div className="truncate text-xs text-gray-600 dark:text-gray-300">{c.lastBody ?? "—"}</div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Area messaggi */}
      <section className="rounded-2xl border border-indigo-50 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 md:col-span-8">
        {activeId ? (
          <>
            <header className="mb-3 border-b border-gray-200 pb-2 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Chat con {activePeer?.name ?? "—"}
              </h3>
            </header>

            <main className="mb-3 space-y-2">
              {messages.map((m: Message) => {
                const mine = myId != null && m.senderId === myId;
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      mine
                        ? "ml-auto max-w-[80%] bg-indigo-600 text-white"
                        : "mr-auto max-w-[80%] bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.body}</div>
                    <div className="mt-1 text-[10px] opacity-70">
                      {new Date(m.createdAt).toLocaleString("it-IT")}
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="rounded-xl bg-gray-50 p-3 text-center text-sm text-gray-500 dark:bg-gray-800/40 dark:text-gray-400">
                  Nessun messaggio.
                </div>
              )}
            </main>

            <footer className="mt-4 flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Scrivi un messaggio…"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={onSend}
                disabled={!draft.trim() || sending || !activeId}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Invia
              </button>
            </footer>
          </>
        ) : (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Nessuna conversazione.</div>
        )}
      </section>
    </div>
  );
}
