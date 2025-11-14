// client/src/components/chat/ConversationList.tsx
import { Search } from "lucide-react";
import { useMemo } from "react";

const badgeClass =
  "inline-block min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-[10px] leading-5 text-white text-center";

type ConversationSummary = {
  conversationId: number;
  peer: { userId: number; name: string; avatarUrl?: string };
  lastBody: string | null;
  lastAt: string | null;
  unread: number;
};

type Props = {
  conversations: ConversationSummary[];
  unreadByThread: Record<number, number>;
  activeId: number | null;
  query: string;
  onQueryChange: (value: string) => void;
  onSelectConversation: (id: number) => void;
};

export default function ConversationList({
  conversations,
  unreadByThread,
  activeId,
  query,
  onQueryChange,
  onSelectConversation,
}: Props) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((c) => {
      const name = c.peer.name?.toLowerCase() ?? "";
      const body = c.lastBody?.toLowerCase() ?? "";
      return name.includes(q) || body.includes(q);
    });
  }, [conversations, query]);

  return (
    <aside className="h-full overflow-hidden rounded-2xl border bg-white p-3 dark:border-gray-800 dark:bg-gray-900 md:col-span-4">
      {/* Search bar */}
      <div className="mb-2 px-2">
        <label className="sr-only" htmlFor="chat-search">
          Cerca conversazioni
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="chat-search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Cerca per nome o messaggio…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-2 text-sm text-slate-800 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-800 dark:focus:ring-indigo-900/30"
          />
        </div>
      </div>

      {/* Lista conversazioni */}
      <div className="h-[calc(100%-40px)] overflow-y-auto no-scrollbar pr-1">
        <ul className="space-y-1">
          {filtered.map((c) => {
            const unread = unreadByThread[c.conversationId] ?? c.unread ?? 0;

            return (
              <li key={c.conversationId}>
                <button
                  type="button"
                  onClick={() => onSelectConversation(c.conversationId)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    activeId === c.conversationId
                      ? "bg-slate-50 ring-1 ring-indigo-200/60 dark:bg-slate-800 dark:ring-indigo-800/40"
                      : "ring-1 ring-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {c.peer.avatarUrl ? (
                      <img
                        src={c.peer.avatarUrl}
                        alt={c.peer.name}
                        className="h-8 w-8 rounded-full object-cover ring-1 ring-white/60 dark:ring-gray-900/60"
                        loading="lazy"
                      />
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-500 text-xs font-semibold uppercase text-white">
                        {c.peer.name?.[0] ?? "?"}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-50">
                          {c.peer.name}
                        </p>
                        {c.lastAt && (
                          <time className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                            {new Date(c.lastAt).toLocaleString("it-IT")}
                          </time>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                          {c.lastBody || "Nessun messaggio"}
                        </p>
                        {unread > 0 && (
                          <span className={badgeClass} aria-label={`${unread} messaggi non letti`}>
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}

          {filtered.length === 0 && (
            <li className="px-2 py-4 text-center text-xs text-slate-400">
              Nessuna conversazione trovata.
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}