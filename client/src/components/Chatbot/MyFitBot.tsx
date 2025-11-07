import { useEffect, useMemo, useRef, useState } from "react";
import {
  X, Send, Bot as BotIcon, User as UserIcon,
  Search, PanelLeftOpen, PanelLeftClose, Plus,
  FolderPlus, Folder, FolderOpen, Pencil, Trash2,
} from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

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
  const hasUserId =
    typeof user?.id === "number" ||
    (typeof user?.id === "string" && String(user?.id).trim() !== "");
  const hasToken =
    typeof token === "string" ? token.trim().length > 10 : Boolean(token);
  const isAuthenticated: boolean = Boolean(rawFlag === true || hasUserId || hasToken);
  return { isAuthenticated, user };
};

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type Offset = { top?: number; right?: number; bottom?: number; left?: number };

type Props = {
  position?: Corner;
  offset?: Offset;
  panelWidth?: number;
  panelMaxVH?: number;
  welcome?: string;
};

type AssistantMessage = {
  id: number;
  senderId: number;
  body: string;
  createdAt?: string;
};

type AssistantThread = {
  threadId: number;
  title: string | null;
  folderId: number | null;
  lastBody: string | null;
  lastAt: string | null;
  unread: number;
};

type AssistantFolder = { id: number; name: string; createdAt?: string };

// utils
function autoTitleFrom(text: string) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return "Nuova conversazione";
  const sentence = t.split(/[.!?]\s/)[0] || t;
  let title = sentence.slice(0, 60);
  if (sentence.length > 60) title = title.replace(/\s+\S*$/, "") + "…";
  return title.charAt(0).toUpperCase() + title.slice(1);
}
const monthsIT = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
function fmtTime(d: Date) { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function fmtStamp(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const today0 = startOfDay(now).getTime();
  const msg0 = startOfDay(d).getTime();
  if (msg0 === today0) return `oggi • ${fmtTime(d)}`;
  if (msg0 === today0 - 86400000) return `ieri • ${fmtTime(d)}`;
  return `${d.getDate()} ${monthsIT[d.getMonth()]} • ${fmtTime(d)}`;
}

export default function MyFitBot({
  position = "top-left",
  offset,
  panelWidth = 720,
  panelMaxVH = 70,
  welcome = "Ciao! Sono **MyFitBot** 🤖 Come posso aiutarti?",
}: Props) {
  const { isAuthenticated, user } = useAuthState();
  const myId = Number((user as any)?.id ?? -1);

  // UI
  const [open, setOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // folders / threads
  const [folders, setFolders] = useState<AssistantFolder[]>([]);
  const [threads, setThreads] = useState<AssistantThread[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);

  // inline edit states
  const [editingFolderId, setEditingFolderId] = useState<number | "new" | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [editingThreadId, setEditingThreadId] = useState<number | null>(null);
  const [editingThreadTitle, setEditingThreadTitle] = useState("");

  // drag & drop
  const [dragThreadId, setDragThreadId] = useState<number | null>(null);

  // messages
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  // id bot per calcolo lato messaggio
  const [botUserId, setBotUserId] = useState<number | null>(null);

  // search
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

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
    ...(position.includes("top") ? { top: (offset?.top ?? 96) + 48 + "px" } : {}),
    ...(position.includes("bottom") ? { bottom: (offset?.bottom ?? 20) + 48 + "px" } : {}),
    ...(position.includes("left") ? { left: (offset?.left ?? 20) + "px" } : {}),
    ...(position.includes("right") ? { right: (offset?.right ?? 20) + "px" } : {}),
  };

  // bootstrap
  useEffect(() => {
    if (!isAuthenticated) {
      setOpen(false);
      setFolders([]); setThreads([]); setMessages([]);
      setActiveFolderId(null); setActiveThreadId(null);
      setBotUserId(null);
      return;
    }
    (async () => {
      await loadFolders();
      await loadThreads();
    })();
  }, [isAuthenticated]);

  // loads
  async function loadFolders() {
    try {
      const resp = await api.get<AssistantFolder[]>("/assistant/folders");
      const data = (resp as any)?.data ?? resp;
      setFolders(Array.isArray(data) ? data : []);
    } catch {}
  }
  async function loadThreads() {
    try {
      const params: Record<string, string> = {};
      if (activeFolderId) params.folderId = String(activeFolderId);
      if (q) params.search = q;
      const qs = Object.keys(params).length ? "?" + new URLSearchParams(params).toString() : "";
      const resp = await api.get<AssistantThread[]>(`/assistant/threads${qs}`);
      const data = (resp as any)?.data ?? resp;
      const list = Array.isArray(data) ? data : [];
      setThreads(list);
      // no auto-select
    } catch {}
  }
  async function loadMessages(threadId: number) {
    try {
      setLoading(true);
      const resp = await api.get<{ threadId: number; messages: AssistantMessage[]; botUserId?: number }>(`/assistant/thread/${threadId}`);
      const data = (resp as any)?.data ?? resp;
      setMessages(data?.messages || []);
      if (typeof data?.botUserId === "number") setBotUserId(data.botUserId);
    } finally {
      setLoading(false);
    }
  }

  // folder ops
  async function createFolderInline() {
    setEditingFolderId("new");
    setEditingFolderName("");
  }
  async function submitCreateFolder() {
    const name = editingFolderName.trim();
    if (!name) { setEditingFolderId(null); setEditingFolderName(""); return; }
    await api.post("/assistant/folders", { name });
    setEditingFolderId(null); setEditingFolderName("");
    await loadFolders();
    await loadThreads();
  }
  async function startRenameFolder(fid: number, currentName: string) {
    setEditingFolderId(fid);
    setEditingFolderName(currentName);
  }
  async function submitRenameFolder(fid: number) {
    const name = editingFolderName.trim();
    if (!name) { setEditingFolderId(null); setEditingFolderName(""); return; }
    await api.patch(`/assistant/folders/${fid}`, { name });
    setEditingFolderId(null); setEditingFolderName("");
    await loadFolders();
    await loadThreads();
  }
  async function deleteFolder(fid: number) {
    try {
      await api.del(`/assistant/folders/${fid}`);
      if (activeFolderId === fid) setActiveFolderId(null);
      await loadFolders();
      await loadThreads();
    } catch (e) {
      // backend blocca cancellazione se non vuota
      alert("La cartella non è vuota oppure non può essere eliminata.");
    }
  }

  // thread ops
  async function startRenameThread(t: AssistantThread) {
    setEditingThreadId(t.threadId);
    setEditingThreadTitle(t.title || "");
  }
  async function submitRenameThread(tid: number) {
    const title = editingThreadTitle.trim();
    if (!title) { setEditingThreadId(null); setEditingThreadTitle(""); return; }
    await api.patch(`/assistant/thread/${tid}`, { title });
    setEditingThreadId(null); setEditingThreadTitle("");
    await loadThreads();
  }
  async function moveThread(tid: number, folderId: number | null) {
    await api.patch(`/assistant/thread/${tid}`, { folderId });
    await loadThreads();
  }
  async function deleteThread(tid: number) {
    try {
      await api.del(`/assistant/thread/${tid}`);
      if (activeThreadId === tid) {
        setActiveThreadId(null);
        setMessages([]);
      }
      await loadThreads();
    } catch {
      alert("Impossibile eliminare la conversazione.");
    }
  }

  // reload on filters
  useEffect(() => { if (isAuthenticated) { loadThreads(); } }, [activeFolderId, q]); // eslint-disable-line

  // autoscroll
  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, open, sending]);

  // focus on open
  useEffect(() => {
    if (open && isAuthenticated) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open, isAuthenticated]);

  // lato messaggi
  const isMine = (m: AssistantMessage) => {
    if (typeof botUserId === "number") return m.senderId !== botUserId;
    return m.senderId === 0 || m.senderId === myId;
  };

  // send (crea thread solo quando invii, se non esiste)
  const onSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isAuthenticated || sending) return;
    const text = input.trim();
    if (!text) return;

    let threadId = activeThreadId;
    if (!threadId) {
      // crea thread silenzioso
      const resp = await api.post<{ threadId: number }>("/assistant/threads", {
        title: autoTitleFrom(text),
        folderId: activeFolderId ?? undefined,
      });
      const data = (resp as any)?.data ?? resp;
      const created = Number(data?.threadId);
      if (!created) return;
      threadId = created;
      setActiveThreadId(created);
      await loadMessages(created);
      await loadThreads();
    }

    setInput("");
    const tempId = Date.now();
    setMessages(prev => [...prev, { id: tempId, senderId: 0, body: text, createdAt: new Date().toISOString() }]);
    setSending(true);

    try {
      const resp = await api.post<{
        threadId: number;
        messageUser: AssistantMessage;
        messageBot: AssistantMessage;
        botUserId?: number;
      }>(`/assistant/thread/${threadId}/send`, { text });

      const data = (resp as any)?.data ?? resp;
      if (typeof data?.botUserId === "number") setBotUserId(data.botUserId);

      const mu = data?.messageUser ?? { id: tempId, senderId: myId, body: text, createdAt: new Date().toISOString() };
      const mb = data?.messageBot ?? { id: tempId + 1, senderId: -999, body: "…", createdAt: new Date().toISOString() };

      setMessages(prev => prev.filter(m => m.id !== tempId).concat([mu, mb]));
      await loadThreads();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId).concat([{ id: tempId, senderId: -1, body: "Errore nell'invio.", createdAt: new Date().toISOString() }]));
    } finally {
      setSending(false);
    }
  };

  // filters
  const shownMessages = useMemo(
    () => (!q ? messages : messages.filter(m => (m.body || "").toLowerCase().includes(q))),
    [messages, q]
  );
  const filteredThreads = useMemo(
    () => (!q ? threads : threads.filter(t =>
      (t.title || "").toLowerCase().includes(q) || (t.lastBody || "").toLowerCase().includes(q)
    )),
    [threads, q]
  );
  const threadsInActiveFolder = useMemo(
    () => threads.filter(t => (activeFolderId ? t.folderId === activeFolderId : true)),
    [threads, activeFolderId]
  );

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          setOpen(v => !v);
          (e.currentTarget as HTMLButtonElement).blur();
        }}
        style={btnStyle}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none"
        title={open ? "Chiudi MyFitBot" : "Apri MyFitBot"}
        aria-label={open ? "Chiudi MyFitBot" : "Apri MyFitBot"}
      >
        <BotIcon className="h-6 w-6" />
      </button>

      {/* Panel */}
      {open && (
        <div
          style={panelStyle}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          {/* Header */}
          <header className="flex items-center justify-between gap-2 border-b border-slate-200 p-3 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <BotIcon className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-semibold">MyFitBot</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => isAuthenticated && setShowSidebar(v => !v)}
                disabled={!isAuthenticated}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                title={isAuthenticated ? (showSidebar ? "Chiudi dashboard" : "Apri dashboard") : "Accedi per usare la dashboard"}
              >
                {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                Dashboard
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

          {/* Body height fixed */}
          <div className="flex" style={{ height: `${panelMaxVH}vh`, minHeight: 360 }}>
            {/* Sidebar */}
            {showSidebar && isAuthenticated && (
              <aside className="w-80 shrink-0 overflow-y-auto border-r border-slate-200 p-3 dark:border-slate-700">
                {/* Search + New folder */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Cerca titoli e messaggi…"
                      className="w-full rounded-md border border-slate-200 pl-8 pr-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900/30"
                    />
                  </div>
                  <button
                    onClick={createFolderInline}
                    className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Nuova cartella"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </button>
                </div>

                {/* Folders */}
                <div className="space-y-1">
                  {/* "Tutte" */}
                  <div
                    className={`group flex items-center justify-between rounded-md px-2 py-1 text-xs ${activeFolderId===null ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                    onClick={() => setActiveFolderId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragThreadId != null) moveThread(dragThreadId, null);
                      setDragThreadId(null);
                    }}
                  >
                    <button className="flex-1 text-left inline-flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" /> Tutte
                    </button>
                  </div>

                  {/* inline create */}
                  {editingFolderId === "new" && (
                    <div className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800/50">
                      <Folder className="h-4 w-4 opacity-60" />
                      <input
                        autoFocus
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitCreateFolder();
                          if (e.key === "Escape") { setEditingFolderId(null); setEditingFolderName(""); }
                        }}
                        onBlur={submitCreateFolder}
                        placeholder="Nome cartella…"
                        className="flex-1 bg-transparent text-xs outline-none"
                      />
                    </div>
                  )}

                  {folders.map(f => {
                    const isEdit = editingFolderId === f.id;
                    return (
                      <div
                        key={f.id}
                        className={`group flex items-center justify-between rounded-md px-2 py-1 text-xs ${activeFolderId===f.id ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragThreadId != null) moveThread(dragThreadId, f.id);
                          setDragThreadId(null);
                        }}
                      >
                        <button
                          className="flex-1 text-left inline-flex items-center gap-2"
                          onClick={() => setActiveFolderId(f.id)}
                          onDoubleClick={() => startRenameFolder(f.id, f.name)}
                          title="Apri cartella"
                        >
                          <Folder className="h-4 w-4" />
                          {!isEdit ? (
                            <span className="line-clamp-1">{f.name}</span>
                          ) : (
                            <input
                              autoFocus
                              value={editingFolderName}
                              onChange={(e) => setEditingFolderName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") submitRenameFolder(f.id);
                                if (e.key === "Escape") { setEditingFolderId(null); setEditingFolderName(""); }
                              }}
                              onBlur={() => submitRenameFolder(f.id)}
                              className="flex-1 bg-transparent outline-none"
                            />
                          )}
                        </button>
                        {/* ghost buttons */}
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {!isEdit && (
                            <button
                              className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                              onClick={() => startRenameFolder(f.id, f.name)}
                              title="Rinomina cartella"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                            onClick={() => deleteFolder(f.id)}
                            title="Elimina cartella"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Preview della cartella selezionata */}
                {activeFolderId !== null && threadsInActiveFolder.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Anteprima
                    </div>
                    <div className="space-y-1">
                      {threadsInActiveFolder.slice(0, 3).map(t => (
                        <div key={t.threadId} className="rounded-md border border-slate-200 p-2 text-xs dark:border-slate-700">
                          <div className="line-clamp-1 font-medium">{t.title || "Senza titolo"}</div>
                          <div className="line-clamp-1 opacity-70">{t.lastBody || "—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Header conversazioni + bottone + */}
                <div className="mt-4 mb-1 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Conversazioni
                  </div>
                  <button
                    onClick={async () => {
                      const r = await api.post<{ threadId: number }>("/assistant/threads", {
                        title: "Nuova conversazione",
                        folderId: activeFolderId ?? undefined,
                      });
                      const tid = Number((r as any)?.data?.threadId ?? (r as any)?.threadId);
                      await loadThreads();
                      if (tid) { setActiveThreadId(tid); await loadMessages(tid); }
                    }}
                    className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Nuova conversazione"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Threads */}
                <ul className="space-y-1">
                  {filteredThreads.map(t => {
                    const isEdit = editingThreadId === t.threadId;
                    return (
                      <li
                        key={t.threadId}
                        className={`group rounded-md border px-2 py-1 text-xs ${
                          activeThreadId===t.threadId
                            ? "border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-700/50 dark:bg-indigo-900/30 dark:text-indigo-100"
                            : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                        }`}
                        draggable
                        onDragStart={() => setDragThreadId(t.threadId)}
                        onDragEnd={() => setDragThreadId(null)}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            className="flex-1 text-left"
                            onClick={async () => { setActiveThreadId(t.threadId); await loadMessages(t.threadId); }}
                            onDoubleClick={() => startRenameThread(t)}
                            title="Apri conversazione"
                          >
                            {!isEdit ? (
                              <>
                                <div className="line-clamp-1 font-medium">{t.title || "Senza titolo"}</div>
                                <div className="line-clamp-1 opacity-70">{t.lastBody || "—"}</div>
                              </>
                            ) : (
                              <input
                                autoFocus
                                value={editingThreadTitle}
                                onChange={(e) => setEditingThreadTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") submitRenameThread(t.threadId);
                                  if (e.key === "Escape") { setEditingThreadId(null); setEditingThreadTitle(""); }
                                }}
                                onBlur={() => submitRenameThread(t.threadId)}
                                className="w-full rounded-sm border border-slate-300 bg-white px-1 py-0.5 dark:border-slate-600 dark:bg-slate-900"
                              />
                            )}
                          </button>

                          {/* ghost actions */}
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {!isEdit && (
                              <button
                                className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                onClick={() => startRenameThread(t)}
                                title="Rinomina conversazione"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                              onClick={() => deleteThread(t.threadId)}
                              title="Elimina conversazione"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}

                  {q && filteredThreads.length === 0 && (
                    <li className="px-3 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      Nessun risultato per “{query}”.
                    </li>
                  )}
                </ul>
              </aside>
            )}

            {/* Messages */}
            <main className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                {!isAuthenticated && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                    <div className="font-medium">Accedi per usare MyFitBot.</div>
                    <div className="text-sm opacity-80">Dopo l’accesso potrai creare più conversazioni e salvarle sul tuo account.</div>
                  </div>
                )}

                {isAuthenticated && activeThreadId == null && (
                  <div className="text-sm text-slate-500">Clicca “+” per avviare una nuova conversazione oppure selezionane una dall’elenco.</div>
                )}

                {isAuthenticated && activeThreadId != null && loading && messages.length === 0 && (
                  <div className="text-sm text-slate-500">Caricamento conversazione…</div>
                )}

                {isAuthenticated && activeThreadId != null && !loading && messages.length === 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700">
                      <div className="mb-1 flex items-center gap-1 text-[11px] opacity-70">
                        <BotIcon className="h-3.5 w-3.5" />
                        MyFitBot
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                        {welcome}
                      </div>
                    </div>
                  </div>
                )}

                {shownMessages.map((m) => {
                  const mine = isMine(m);
                  const stamp = fmtStamp(m.createdAt);
                  const title = m.createdAt ? new Date(m.createdAt).toLocaleString() : undefined;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : ""}`}>
                      <div
                        className={[
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm ring-1",
                          mine
                            ? "bg-indigo-600 text-white ring-indigo-500/30"
                            : "bg-slate-50 text-slate-800 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700",
                        ].join(" ")}
                      >
                        <div className="mb-1 flex items-center gap-1 text-[11px] opacity-70">
                          {mine ? <UserIcon className="h-3.5 w-3.5" /> : <BotIcon className="h-3.5 w-3.5" />}
                          {mine ? "Tu" : "MyFitBot"}
                        </div>
                        <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                          {m.body}
                        </div>
                        {stamp && (
                          <div className={`mt-1 text-[10px] ${mine ? "text-white/70 text-right" : "text-slate-500 dark:text-slate-400"}`} title={title}>
                            {stamp}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {sending && activeThreadId != null && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700">
                      <span className="opacity-70">MyFitBot sta scrivendo…</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </main>
          </div>

          {/* Composer */}
          <footer className="flex items-center gap-2 border-t border-slate-200 p-2 dark:border-slate-700">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isAuthenticated
                  ? (activeThreadId ? "Scrivi un messaggio…" : "Crea o seleziona una conversazione…")
                  : "Scrivi un messaggio… (accedi per inviare)"
              }
              className="h-10 flex-1 resize-none rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900/30"
              onKeyDown={(e) => {
                if (!isAuthenticated) return;
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
            />
            <button
              type="button"
              onClick={onSend}
              disabled={sending || !input.trim() || !isAuthenticated}
              title={!isAuthenticated ? "Accedi per inviare" : (activeThreadId ? "Invia" : "Crea nuova conversazione e invia")}
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