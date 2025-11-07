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
import { useAuth } from "../../hooks/useAuth";
import { useLoginModal } from "../../hooks/useLoginModal";

/* ===================== ADAPTERS per i tuoi hook ===================== */
type MaybeUser = { id?: number | string; username?: string } | null;

const useAuthState = () => {
  const auth = useAuth() as any;

  const rawFlag = auth?.isAuthenticated ?? auth?.isLoggedIn ?? null;
  const user: MaybeUser = auth?.user ?? auth?.me ?? null;

  const token =
    auth?.token ??
    auth?.accessToken ??
    auth?.jwt ??
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  // true se id numerico o stringa non vuota
  const hasUserId =
    typeof user?.id === "number" ||
    (typeof user?.id === "string" && user?.id.trim() !== "");

  // true se token "credibile"
  const hasToken =
    typeof token === "string" ? token.trim().length > 10 : Boolean(token);

  // ordine di priorità: flag esplicito → id → token
  const isAuthenticated: boolean = Boolean(
    rawFlag === true || hasUserId || hasToken
  );

  return { isAuthenticated, user };
};

const useLoginCtl = () => {
  const modal = useLoginModal() as any;
  const openLoginModal = () => {
    if (typeof modal?.open === "function") return modal.open();
    if (typeof modal?.show === "function") return modal.show();
    if (typeof modal?.setOpen === "function") return modal.setOpen(true);
    if (typeof modal?.setVisible === "function") return modal.setVisible(true);
  };
  return { openLoginModal };
};
/* =================================================================== */

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
type FolderT = { id: string; name: string; createdAt: number };

const MAX_HISTORY = 30;

// helpers
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const truncate = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n) + "…");

// genera key per-utente
const makeKeys = (userId: number | null | undefined) => {
  const suffix = userId != null ? String(userId) : "anon";
  return {
    threads: `myfitbot_threads_v1_${suffix}`,
    folders: `myfitbot_folders_v1_${suffix}`,
    ui: `myfitbot_ui_v1_${suffix}`,
  };
};

const normalizeUserId = (id: unknown): number | null => {
  if (typeof id === "number" && Number.isFinite(id)) return id;
  if (typeof id === "string") {
    const n = Number(id);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

export default function MyFitBot({
  position = "top-left",
  offset,
  panelWidth = 560,
  panelMaxVH = 60,
  welcome = "Ciao! Sono **MyFitBot** 🤖 Come posso aiutarti?",
}: Props) {
  const { isAuthenticated, user } = useAuthState();
  const { openLoginModal } = useLoginCtl();
  const userId = normalizeUserId(user?.id);

  const KEYS = makeKeys(userId);

  // UI
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEYS.ui) || "{}");
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

  // Stato per cartelle/thread per-utente
  const [folders, setFolders] = useState<FolderT[]>(() => {
    try {
      const arr = JSON.parse(localStorage.getItem(KEYS.folders) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });
  const [threads, setThreads] = useState<Thread[]>(() => {
    try {
      const arr = JSON.parse(localStorage.getItem(KEYS.threads) || "[]");
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

  // ---- posizionamento (inline styles) ----
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
    ...(position.includes("top") ? { top: ((offset?.top ?? 96) + 48) + "px" } : {}),
    ...(position.includes("bottom") ? { bottom: ((offset?.bottom ?? 20) + 48) + "px" } : {}),
    ...(position.includes("left") ? { left: (offset?.left ?? 20) + "px" } : {}),
    ...(position.includes("right") ? { right: (offset?.right ?? 20) + "px" } : {}),
  };

  /* ================= Persistenza per-utente ================= */

  // A) Cambio utente → ricarica SOLO dallo storage (niente nuovo thread qui)
 useEffect(() => {
  const K = makeKeys(userId);
  try {
    const arrT = JSON.parse(localStorage.getItem(K.threads) || "[]");
    setThreads(Array.isArray(arrT) ? arrT : []);
    setActiveId(Array.isArray(arrT) && arrT[0] ? arrT[0].id : null);
  } catch {
    setThreads([]);
    setActiveId(null);
  }
  try {
    const arrF = JSON.parse(localStorage.getItem(K.folders) || "[]");
    setFolders(Array.isArray(arrF) ? arrF : []);
  } catch {
    setFolders([]);
  }
}, [userId]);

  // B) Persisti cambiamenti
  useEffect(() => {
    try {
      localStorage.setItem(KEYS.threads, JSON.stringify(threads));
    } catch {}
  }, [threads, KEYS.threads]);

  useEffect(() => {
    try {
      localStorage.setItem(KEYS.folders, JSON.stringify(folders));
    } catch {}
  }, [folders, KEYS.folders]);

  useEffect(() => {
    try {
      localStorage.setItem(KEYS.ui, JSON.stringify({ open }));
    } catch {}
  }, [open, KEYS.ui]);

  // C) Pulisci completamente la vista ANON (UI pulita, niente persistenza anon)
  useEffect(() => {
    if (!isAuthenticated) {
      setThreads([]);
      setFolders([]);
      setActiveId(null);
      try {
        localStorage.setItem(KEYS.threads, "[]");
        localStorage.setItem(KEYS.folders, "[]");
      } catch {}
    }
  }, [isAuthenticated, KEYS.threads, KEYS.folders]);

  // D) Crea il primo thread SOLO se loggato e non ce ne sono già
  useEffect(() => {
    if (!isAuthenticated) return;       // niente welcome da anonimo
    if (threads.length > 0) return;     // evita duplicazioni

    const t: Thread = {
      id: uid(),
      title: "Nuova conversazione",
      folderId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      msgs: [{ role: "assistant", content: welcome }], // welcome solo da loggato
    };
    setThreads([t]);
    setActiveId(t.id);
  }, [isAuthenticated, userId, welcome, threads.length]);

  // auto-scroll
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeThread?.msgs, open]);

  // focus input quando apri/switch thread
  useEffect(() => {
    if (open && isAuthenticated) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open, activeId, isAuthenticated]);

  /* ================= Azioni ================= */
  const newThread = () => {
    const t: Thread = {
      id: uid(),
      title: "Nuova conversazione",
      folderId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      msgs: isAuthenticated ? [{ role: "assistant", content: welcome }] : [],
    };
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
    setInput("");
    if (isAuthenticated) setTimeout(() => inputRef.current?.focus(), 0);
  };

  const createFolder = () => {
    const name = prompt("Nome cartella:");
    if (!name) return;
    const f: FolderT = { id: uid(), name: name.trim(), createdAt: Date.now() };
    setFolders((prev) => [...prev, f]);
  };

  const moveThreadToFolder = (threadId: string, folderId: string | null) => {
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, folderId } : t)));
  };

  const renameThread = (threadId: string) => {
    const t = threads.find((x) => x.id === threadId);
    if (!t) return;
    const name = prompt("Rinomina conversazione:", t.title);
    if (!name) return;
    setThreads((prev) => prev.map((x) => (x.id === threadId ? { ...x, title: name.trim() } : x)));
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

    // 🔐 blocca invio se non autenticato
    if (!isAuthenticated) {
      openLoginModal();
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                msgs: [
                  ...t.msgs,
                  { role: "assistant", content: "Per continuare, effettua il login. Clicca **Accedi**." },
                ],
                updatedAt: Date.now(),
              }
            : t
        )
      );
      return;
    }

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
      const hist = activeThread.msgs.concat({ role: "user", content: text }).slice(-MAX_HISTORY);
      const resp = await api.post<{ reply: string }>("/assistant/chat", { messages: hist });
      const reply = (resp as any)?.reply ?? (resp as any)?.data?.reply ?? "Non ho una risposta al momento.";

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, msgs: [...t.msgs, { role: "assistant", content: reply }], updatedAt: Date.now() }
            : t
        )
      );
    } catch (e: any) {
      const status = e?.response?.status ?? e?.status;
      if (status === 401) {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThread.id
              ? {
                  ...t,
                  msgs: [
                    ...t.msgs,
                    { role: "assistant", content: "Serve l’autenticazione per usare MyFitBot. Premi **Accedi**." },
                  ],
                  updatedAt: Date.now(),
                }
              : t
          )
        );
        openLoginModal();
      } else {
        const msg = String(e?.message || "Errore sconosciuto");
        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThread.id
              ? {
                  ...t,
                  msgs: [
                    ...t.msgs,
                    { role: "assistant", content: "Errore: " + (msg.length > 200 ? msg.slice(0, 200) + "…" : msg) },
                  ],
                  updatedAt: Date.now(),
                }
              : t
          )
        );
      }
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
      (by[key] ||= []).push(t);
    }
    return by;
  }, [filteredThreads]);

  /* ================= Render ================= */
  return (
    <>
      {/* Bottone flottante: icona BOT */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          setOpen((v) => {
            const next = !v;
            if (next && isAuthenticated) setTimeout(() => inputRef.current?.focus(), 0);
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
              <button
                onClick={() => isAuthenticated && setShowSidebar(v => !v)}
                disabled={!isAuthenticated}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium
                            text-slate-700 hover:bg-slate-100 disabled:opacity-50
                            dark:text-slate-200 dark:hover:bg-slate-800"
                title={isAuthenticated ? (showSidebar ? "Chiudi dashboard" : "Apri dashboard") : "Accedi per usare la dashboard"}
                >
                {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
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
            {showSidebar && isAuthenticated && (
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

                    <Section title="Senza cartella" icon={<Folder className="h-4 w-4" />}>
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
              {/* Banner login quando non autenticato */}
              {!isAuthenticated && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                    <div className="mb-2 font-medium">Devi essere loggato per usare MyFitBot.</div>
                    <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // 1) prova il tuo hook
                        if (typeof openLoginModal === "function") {
                        openLoginModal();
                        return;
                        }
                        // 2) fallback: chiama quello esposto globalmente dal provider/header
                        (window as any).openLoginModal?.();
                        // 3) fallback estremo: dispatch evento che il provider può intercettare
                        window.dispatchEvent(new CustomEvent("myfit:login:open"));
                    }}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                    Accedi
                    </button>
                </div>
                )}
              {activeThread?.msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={[
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm ring-1",
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
            placeholder={isAuthenticated ? "Scrivi un messaggio…" : "Scrivi un messaggio… (accedi per inviare)"}
            // 👇 lasciamo la textarea SEMPRE attiva; space non buca il gioco
            className="h-10 flex-1 resize-none rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900/30"
            onKeyDownCapture={(e) => {
            if ((e.code === "Space" || e.key === " ") && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.stopPropagation(); // evita il GameRunner
            }
            }}
            onKeyDown={(e) => {
            // blocca Enter se non loggato
            if (!isAuthenticated) return;
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
            }
            }}
        />

        <button
            type="button"
            onClick={send}
            // 👇 disabilita se non loggato o input vuoto o invio in corso
            disabled={sending || !input.trim() || !isAuthenticated}
            title={!isAuthenticated ? "Accedi per inviare" : "Invia"}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
}: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
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
