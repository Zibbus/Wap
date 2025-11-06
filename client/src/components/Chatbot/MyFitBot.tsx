import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Send,
  Bot,
  User,
  Plus,
  FolderPlus,
  Folder,
  Search,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";
import { api } from "../../services/api";

/* =============== Tipi & costanti =============== */
type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type Offset = { top?: number; right?: number; bottom?: number; left?: number };

type Props = {
  position?: Corner;
  offset?: Offset;
  panelWidth?: number;
  panelMaxVH?: number;
  welcome?: string;
};

type Role = "user" | "assistant";
type ChatMsg = { role: Role; content: string };

type Thread = {
  id: string;
  title: string;
  folderId?: string | null;
  createdAt: number;
  updatedAt: number;
  msgs: ChatMsg[];
};

type FolderT = {
  id: string;
  name: string;
  createdAt: number;
};

const STORAGE_THREADS = "myfitbot_threads_v1";
const STORAGE_FOLDERS = "myfitbot_folders_v1";
const STORAGE_UI = "myfitbot_ui_v1";
const MAX_HISTORY = 30;

/* helpers */
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const truncate = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n) + "…");

/* =============== Componente =============== */
export default function MyFitBot({
  position = "top-left",
  offset,
  panelWidth = 560, // ← più largo di default
  panelMaxVH = 60,
  welcome = "Ciao! Sono **MyFitBot** 🤖 Come posso aiutarti?",
}: Props) {
  // Stato UI
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_UI) || "{}");
      return !!saved.open;
    } catch {
      return false;
    }
  });
  const [showSidebar, setShowSidebar] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");

  // Refs
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Folders + Threads
  const [folders, setFolders] = useState<FolderT[]>(() => {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_FOLDERS) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });
  const [threads, setThreads] = useState<Thread[]>(() => {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_THREADS) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId]
  );

  // ---- posizionamento (inline style) ----
  const btnStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 60,
    ...(position.includes("top") ? { top: (offset?.top ?? 96) + "px" } : {}),
    ...(position.includes("bottom") ? { bottom: (offset?.bottom ?? 20) + "px" } : {}),
    ...(position.includes("left") ? { left: (offset?.left ?? 20) + "px" } : {}),
    ...(position.includes("right") ? { right: (offset?.right ?? 20) + "px" } : {}),
  };

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 60,
    width: `min(${panelWidth}px, calc(100vw - 2.5rem))`,
    maxWidth: "calc(100vw - 2.5rem)",
    ...(position.includes("top")
      ? { top: ((offset?.top ?? 96) + 48) + "px" }
      : {}),
    ...(position.includes("bottom")
      ? { bottom: ((offset?.bottom ?? 20) + 48) + "px" }
      : {}),
    ...(position.includes("left") ? { left: (offset?.left ?? 20) + "px" } : {}),
    ...(position.includes("right") ? { right: (offset?.right ?? 20) + "px" } : {}),
  };

  /* ================= Persistenza ================= */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_THREADS, JSON.stringify(threads));
    } catch {}
  }, [threads]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FOLDERS, JSON.stringify(folders));
    } catch {}
  }, [folders]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_UI, JSON.stringify({ open }));
    } catch {}
  }, [open]);

  // All'avvio: nuova conversazione (le vecchie rimangono)
  useEffect(() => {
    const t: Thread = {
      id: uid(),
      title: "Nuova conversazione",
      folderId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      msgs: [{ role: "assistant", content: welcome }],
    };
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
  }, [welcome]);

  // auto-scroll
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeThread?.msgs, open]);

  // focus input quando apri/switch thread
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open, activeId]);

  /* ================= Azioni ================= */
  const newThread = () => {
    const t: Thread = {
      id: uid(),
      title: "Nuova conversazione",
      folderId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      msgs: [{ role: "assistant", content: welcome }],
    };
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const createFolder = () => {
    const name = prompt("Nome cartella:");
    if (!name) return;
    const f: FolderT = { id: uid(), name: name.trim(), createdAt: Date.now() };
    setFolders((prev) => [...prev, f]);
  };

  const moveThreadToFolder = (threadId: string, folderId: string | null) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, folderId } : t))
    );
  };

  const renameThread = (threadId: string) => {
    const t = threads.find((x) => x.id === threadId);
    if (!t) return;
    const name = prompt("Rinomina conversazione:", t.title);
    if (!name) return;
    setThreads((prev) =>
      prev.map((x) => (x.id === threadId ? { ...x, title: name.trim() } : x))
    );
  };

  const deleteThread = (threadId: string) => {
    if (!confirm("Eliminare questa conversazione?")) return;
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    if (activeId === threadId) {
      const next = threads.find((t) => t.id !== threadId);
      setActiveId(next ? next.id : null);
    }
  };

  async function send() {
    if (!activeThread) return;
    const text = input.trim();
    if (!text || sending) return;

    setInput("");

    // append user
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              msgs: [...t.msgs, { role: "user", content: text }],
              updatedAt: Date.now(),
              title:
                t.title === "Nuova conversazione"
                  ? truncate(text.replace(/\s+/g, " "), 40)
                  : t.title,
            }
          : t
      )
    );

    setSending(true);
    try {
      const hist =
        activeThread.msgs
          .concat({ role: "user", content: text })
          .slice(-MAX_HISTORY);

      const resp = await api.post<{ reply: string }>("/assistant/chat", {
        messages: hist,
      });

      const reply = (resp as any)?.reply ?? (resp as any)?.data?.reply ?? "Non ho una risposta al momento.";

      // append assistant
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                msgs: [...t.msgs, { role: "assistant", content: reply }],
                updatedAt: Date.now(),
              }
            : t
        )
      );
    } catch (e: any) {
      const msg = String(e?.message || "Errore sconosciuto");
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                msgs: [
                  ...t.msgs,
                  {
                    role: "assistant",
                    content:
                      "Errore: " +
                      (msg.length > 200 ? msg.slice(0, 200) + "…" : msg) +
                      "\n\nVerifica il backend dell’assistant.",
                  },
                ],
                updatedAt: Date.now(),
              }
            : t
        )
      );
    } finally {
      setSending(false);
    }
  }

  /* ================= Filtri & viste ================= */
  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = threads;
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.msgs.some((m) => m.content.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [threads, query]);

  const threadsByFolder = useMemo(() => {
    const by: Record<string, Thread[]> = {};
    for (const t of filteredThreads) {
      const key = t.folderId || "__none";
      by[key] = by[key] || [];
      by[key].push(t);
    }
    return by;
  }, [filteredThreads]);

  /* ================= Render ================= */
  return (
    <>
      {/* Bottone flottante: icona BOT */}
      <button
        type="button"
        onClick={(e) => {
          setOpen((v) => {
            const next = !v;
            if (next) setTimeout(() => inputRef.current?.focus(), 0);
            return next;
          });
          (e.currentTarget as HTMLButtonElement).blur();
        }}
        style={btnStyle}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none"
        title={open ? "Chiudi MyFitBot" : "Apri MyFitBot"}
        aria-label={open ? "Chiudi MyFitBot" : "Apri MyFitBot"}
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Pannello */}
      {open && (
        <div
          style={panelStyle}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          {/* Header */}
          <header className="flex items-center justify-between gap-2 border-b border-slate-200 p-3 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-semibold">MyFitBot</span>
            </div>
            <div className="flex items-center gap-2">
              {/* ← Nuovo tasto Dashboard ON/OFF */}
              <button
                onClick={() => setShowSidebar((v) => !v)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                title={showSidebar ? "Chiudi dashboard" : "Apri dashboard"}
              >
                {showSidebar ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
                Dashboard
              </button>

              <button
                onClick={newThread}
                className="flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                title="Nuova conversazione"
              >
                <Plus className="h-4 w-4" />
                Nuova
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Chiudi MyFitBot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex" style={{ maxHeight: `${panelMaxVH}vh`, minHeight: 320 }}>
            {/* Sidebar conversazioni */}
            {showSidebar && (
              <aside className="w-64 shrink-0 border-r border-slate-200 p-2 dark:border-slate-700">
                <div className="mb-2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Cerca…"
                      className="w-full rounded-md border border-slate-200 pl-8 pr-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900/30"
                    />
                  </div>
                  <button
                    onClick={createFolder}
                    className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Nuova cartella"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </button>
                </div>

                {/* Senza cartella */}
                <Section
                  title="Senza cartella"
                  icon={<Folder className="h-4 w-4" />}
                >
                  {(threadsByFolder["__none"] || []).map((t) => (
                    <ThreadRow
                      key={t.id}
                      t={t}
                      active={t.id === activeId}
                      folders={folders}
                      onOpen={() => setActiveId(t.id)}
                      onRename={() => renameThread(t.id)}
                      onDelete={() => deleteThread(t.id)}
                      onMove={(folderId) => moveThreadToFolder(t.id, folderId)}
                    />
                  ))}
                </Section>

                {/* Cartelle */}
                {folders.map((f) => (
                  <Section key={f.id} title={f.name} icon={<Folder className="h-4 w-4" />}>
                    {(threadsByFolder[f.id] || []).map((t) => (
                      <ThreadRow
                        key={t.id}
                        t={t}
                        active={t.id === activeId}
                        folders={folders}
                        onOpen={() => setActiveId(t.id)}
                        onRename={() => renameThread(t.id)}
                        onDelete={() => deleteThread(t.id)}
                        onMove={(folderId) => moveThreadToFolder(t.id, folderId)}
                      />
                    ))}
                  </Section>
                ))}
              </aside>
            )}

            {/* Area messaggi */}
            <main className="flex-1 space-y-2 overflow-y-auto p-3">
              {activeThread?.msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={[
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm ring-1", // leggermente più largo
                      m.role === "user"
                        ? "bg-indigo-600 text-white ring-indigo-500/30"
                        : "bg-slate-50 text-slate-800 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700",
                    ].join(" ")}
                  >
                    <div className="mb-1 flex items-center gap-1 text-[11px] opacity-70">
                      {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                      {m.role === "user" ? "Tu" : "MyFitBot"}
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700">
                    <span className="opacity-70">MyFitBot sta scrivendo…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </main>
          </div>

          {/* Composer */}
          <footer className="flex items-center gap-2 border-t border-slate-200 p-2 dark:border-slate-700">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scrivi un messaggio…"
              className="h-10 flex-1 resize-none rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900/30"
              onKeyDownCapture={(e) => {
                if ((e.code === "Space" || e.key === " ") && !e.ctrlKey && !e.metaKey && !e.altKey) {
                  e.stopPropagation(); // evita il GameRunner
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !input.trim()}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </footer>
        </div>
      )}
    </>
  );
}

/* =============== Sub-componenti =============== */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {icon} <span>{title}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ThreadRow({
  t,
  active,
  folders,
  onOpen,
  onRename,
  onDelete,
  onMove,
}: {
  t: Thread;
  active: boolean;
  folders: FolderT[];
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove: (folderId: string | null) => void;
}) {
  return (
    <div
      className={
        "group rounded-md border px-2 py-1 text-xs " +
        (active
          ? "border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-700/50 dark:bg-indigo-900/30 dark:text-indigo-100"
          : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800")
      }
    >
      <button className="w-full text-left" onClick={onOpen} title="Apri conversazione">
        <div className="line-clamp-1">{t.title || "Senza titolo"}</div>
      </button>

      <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <select
          className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px] dark:border-slate-700 dark:bg-slate-900"
          value={t.folderId || ""}
          onChange={(e) => onMove(e.target.value || null)}
          title="Sposta in cartella"
        >
          <option value="">Senza cartella</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <button
          onClick={onRename}
          className="rounded px-1 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          title="Rinomina"
        >
          Rinomina
        </button>
        <button
          onClick={onDelete}
          className="rounded px-1 py-0.5 text-[11px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          title="Elimina"
        >
          Elimina
        </button>
      </div>
    </div>
  );
}
