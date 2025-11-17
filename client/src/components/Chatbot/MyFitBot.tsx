import { useEffect, useMemo, useRef, useState } from "react";
import { Bot as BotIcon, User as UserIcon } from "lucide-react";

import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

// Componenti
import { ChatBotHeader } from "./ChatBotHeader";
import { ChatBotFooter } from "./ChatBotFooter";
import { ChatBotSidebar } from "./ChatBotSidebar";

type MaybeUser = { id?: number | string; username?: string } | null;

// Autenticazione del bot per capire se l'utente è loggato
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
  const isAuthenticated: boolean = Boolean(
    rawFlag === true || hasUserId || hasToken
  );
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

// Creazione del titolo automatica
function autoTitleFrom(text: string) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return "Nuova conversazione";
  const sentence = t.split(/[.!?]\s/)[0] || t;
  let title = sentence.slice(0, 60);
  if (sentence.length > 60) title = title.replace(/\s+\S*$/, "") + "…";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

// Creazione automatica del timestamp
const monthsIT = [
  "gen",
  "feb",
  "mar",
  "apr",
  "mag",
  "giu",
  "lug",
  "ago",
  "set",
  "ott",
  "nov",
  "dic",
];
function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
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
  const [editingFolderId, setEditingFolderId] = useState<
    number | "new" | null
  >(null);
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
  // 🔧 fix tipo: RefObject<HTMLTextAreaElement> (niente `| null` nel generico)
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const btnStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 60,
    ...(position.includes("top") ? { top: (offset?.top ?? 96) + "px" } : {}),
    ...(position.includes("bottom")
      ? { bottom: (offset?.bottom ?? 20) + "px" }
      : {}),
    ...(position.includes("left")
      ? { left: (offset?.left ?? 20) + "px" }
      : {}),
    ...(position.includes("right")
      ? { right: (offset?.right ?? 20) + "px" }
      : {}),
  };
  const panelStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 60,
    width: `min(${panelWidth}px, calc(100vw - 2.5rem))`,
    maxWidth: "calc(100vw - 2.5rem)",
    ...(position.includes("top")
      ? { top: (offset?.top ?? 96) + 48 + "px" }
      : {}),
    ...(position.includes("bottom")
      ? { bottom: (offset?.bottom ?? 20) + 48 + "px" }
      : {}),
    ...(position.includes("left")
      ? { left: (offset?.left ?? 20) + "px" }
      : {}),
    ...(position.includes("right")
      ? { right: (offset?.right ?? 20) + "px" }
      : {}),
  };

  // bootstrap
  useEffect(() => {
    if (!isAuthenticated) {
      setOpen(false);
      setFolders([]);
      setThreads([]);
      setMessages([]);
      setActiveFolderId(null);
      setActiveThreadId(null);
      setBotUserId(null);
      return;
    }
    (async () => {
      await loadFolders();
      await loadThreads();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Carica cartelle e chat
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
      const qs = Object.keys(params).length
        ? "?" + new URLSearchParams(params).toString()
        : "";
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
      const resp = await api.get<{
        threadId: number;
        messages: AssistantMessage[];
        botUserId?: number;
      }>(`/assistant/thread/${threadId}`);
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
    if (!name) {
      setEditingFolderId(null);
      setEditingFolderName("");
      return;
    }
    await api.post("/assistant/folders", { name });
    setEditingFolderId(null);
    setEditingFolderName("");
    await loadFolders();
    await loadThreads();
  }
  async function startRenameFolder(fid: number, currentName: string) {
    setEditingFolderId(fid);
    setEditingFolderName(currentName);
  }
  async function submitRenameFolder(fid: number) {
    const name = editingFolderName.trim();
    if (!name) {
      setEditingFolderId(null);
      setEditingFolderName("");
      return;
    }
    await api.patch(`/assistant/folders/${fid}`, { name });
    setEditingFolderId(null);
    setEditingFolderName("");
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
    if (!title) {
      setEditingThreadId(null);
      setEditingThreadTitle("");
      return;
    }
    await api.patch(`/assistant/thread/${tid}`, { title });
    setEditingThreadId(null);
    setEditingThreadTitle("");
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

  // handler estratti per la sidebar (stessa logica di prima)
  const handleCreateThread = async () => {
    const r = await api.post<{ threadId: number }>("/assistant/threads", {
      title: "Nuova conversazione",
      folderId: activeFolderId ?? undefined,
    });
    const tid = Number((r as any)?.data?.threadId ?? (r as any)?.threadId);
    await loadThreads();
    if (tid) {
      setActiveThreadId(tid);
      await loadMessages(tid);
    }
  };

  const handleOpenThread = async (threadId: number) => {
    setActiveThreadId(threadId);
    await loadMessages(threadId);
  };

  // reload on filters
  useEffect(() => {
    if (isAuthenticated) {
      loadThreads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolderId, q]);

  // autoscroll
  useEffect(() => {
    if (open)
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
  }, [messages, open, sending]);

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

  // === Helper invio con fallback chiavi body ===
  async function sendAssistantMessage(threadId: number, text: string) {
    // 1) prova con { text }
    try {
      return await api.post<{
        threadId: number;
        messageUser: AssistantMessage;
        messageBot: AssistantMessage;
        botUserId?: number;
      }>(`/assistant/thread/${threadId}/send`, { text });
    } catch (e: any) {
      const msg = (e?.message || "").toLowerCase();

      // 2) se il backend si aspetta { message }
      if (
        msg.includes("text") ||
        msg.includes("campo") ||
        msg.includes("missing") ||
        msg.includes("invalid")
      ) {
        try {
          return await api.post<{
            threadId: number;
            messageUser: AssistantMessage;
            messageBot: AssistantMessage;
            botUserId?: number;
          }>(`/assistant/thread/${threadId}/send`, { message: text });
        } catch (e2: any) {
          const msg2 = (e2?.message || "").toLowerCase();

          // 3) ultimo tentativo: { prompt }
          if (
            msg2.includes("message") ||
            msg2.includes("missing") ||
            msg2.includes("invalid")
          ) {
            return await api.post<{
              threadId: number;
              messageUser: AssistantMessage;
              messageBot: AssistantMessage;
              botUserId?: number;
            }>(`/assistant/thread/${threadId}/send`, { prompt: text });
          }
          throw e2;
        }
      }
      throw e;
    }
  }

  // Utility per estrarre un messaggio leggibile d’errore
  function toMessage(e: unknown, fallback = "Errore nell'invio") {
    if (e instanceof Error) return e.message;
    if (typeof e === "string") return e;
    try {
      return JSON.stringify(e);
    } catch {
      return fallback;
    }
  }

  // send (crea thread solo quando invii, se non esiste)
  const onSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isAuthenticated || sending) return;
    const text = input.trim();
    if (!text) return;

    let threadId = activeThreadId;

    // Se non c'è una conversazione attiva, creane una
    if (!threadId) {
      try {
        const resp = await api.post<{ threadId: number }>(
          "/assistant/threads",
          {
            title: autoTitleFrom(text),
            folderId: activeFolderId ?? undefined,
          }
        );
        const data = (resp as any)?.data ?? resp;
        const created = Number(data?.threadId);
        if (!created)
          throw new Error("Impossibile creare una nuova conversazione");
        threadId = created;
        setActiveThreadId(created);
        await loadMessages(created);
        await loadThreads();
      } catch (e) {
        alert(toMessage(e, "Creazione conversazione fallita"));
        return;
      }
    }

    setInput("");
    const tempId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        senderId: 0,
        body: text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setSending(true);

    try {
      // 🔁 invio con fallback chiavi { text } → { message } → { prompt }
      const resp = await sendAssistantMessage(threadId!, text);
      const data = (resp as any)?.data ?? resp;

      if (typeof data?.botUserId === "number") setBotUserId(data.botUserId);

      const mu =
        data?.messageUser ?? {
          id: tempId,
          senderId: myId,
          body: text,
          createdAt: new Date().toISOString(),
        };
      const mb =
        data?.messageBot ?? {
          id: tempId + 1,
          senderId: -999,
          body: "…",
          createdAt: new Date().toISOString(),
        };

      setMessages((prev) =>
        prev.filter((m) => m.id !== tempId).concat([mu, mb])
      );
      await loadThreads();
    } catch (e) {
      const msg = toMessage(e, "Errore nell'invio del messaggio");
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== tempId)
          .concat([
            {
              id: tempId,
              senderId: -1,
              body: `❌ ${msg}`,
              createdAt: new Date().toISOString(),
            },
          ])
      );
    } finally {
      setSending(false);
    }
  };

  // filters
  const shownMessages = useMemo(
    () =>
      !q
        ? messages
        : messages.filter((m) =>
            (m.body || "").toLowerCase().includes(q)
          ),
    [messages, q]
  );
  const filteredThreads = useMemo(
    () =>
      !q
        ? threads
        : threads.filter(
            (t) =>
              (t.title || "").toLowerCase().includes(q) ||
              (t.lastBody || "").toLowerCase().includes(q)
          ),
    [threads, q]
  );
  const threadsInActiveFolder = useMemo(
    () =>
      threads.filter((t) =>
        activeFolderId ? t.folderId === activeFolderId : true
      ),
    [threads, activeFolderId]
  );

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          setOpen((v) => !v);
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
          <ChatBotHeader
            isAuthenticated={isAuthenticated}
            showSidebar={showSidebar}
            onToggleSidebar={() => setShowSidebar((v) => !v)}
            onClose={() => setOpen(false)}
          />

          {/* Body height fixed */}
          <div
            className="flex"
            style={{ height: `${panelMaxVH}vh`, minHeight: 360 }}
          >
            {/* Sidebar */}
            {showSidebar && isAuthenticated && (
              <ChatBotSidebar
                query={query}
                setQuery={setQuery}
                q={q}
                folders={folders}
                activeFolderId={activeFolderId}
                setActiveFolderId={setActiveFolderId}
                editingFolderId={editingFolderId}
                editingFolderName={editingFolderName}
                setEditingFolderName={setEditingFolderName}
                createFolderInline={createFolderInline}
                submitCreateFolder={submitCreateFolder}
                startRenameFolder={startRenameFolder}
                submitRenameFolder={submitRenameFolder}
                deleteFolder={deleteFolder}
                threadsInActiveFolder={threadsInActiveFolder}
                filteredThreads={filteredThreads}
                activeThreadId={activeThreadId}
                editingThreadId={editingThreadId}
                editingThreadTitle={editingThreadTitle}
                setEditingThreadTitle={setEditingThreadTitle}
                startRenameThread={startRenameThread}
                submitRenameThread={submitRenameThread}
                deleteThread={deleteThread}
                dragThreadId={dragThreadId}
                setDragThreadId={setDragThreadId}
                moveThread={moveThread}
                onCreateThread={handleCreateThread}
                onOpenThread={handleOpenThread}
              />
            )}

            {/* Messages */}
            <main className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                {!isAuthenticated && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                    <div className="font-medium">
                      Accedi per usare MyFitBot.
                    </div>
                    <div className="text-sm opacity-80">
                      Dopo l’accesso potrai creare più conversazioni e salvarle
                      sul tuo account.
                    </div>
                  </div>
                )}

                {isAuthenticated && activeThreadId == null && (
                  <div className="text-sm text-slate-500">
                    Clicca “+” per avviare una nuova conversazione oppure
                    selezionane una dall’elenco.
                  </div>
                )}

                {isAuthenticated &&
                  activeThreadId != null &&
                  loading &&
                  messages.length === 0 && (
                    <div className="text-sm text-slate-500">
                      Caricamento conversazione…
                    </div>
                  )}

                {isAuthenticated &&
                  activeThreadId != null &&
                  !loading &&
                  messages.length === 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700">
                        <div className="mb-1 flex items-center gap-1 text-[11px] opacity-70">
                          <BotIcon className="h-3.5 w-3.5" />
                          MyFitBot
                        </div>
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">
                          {welcome}
                        </div>
                      </div>
                    </div>
                  )}

                {shownMessages.map((m) => {
                  const mine = isMine(m);
                  const stamp = fmtStamp(m.createdAt);
                  const title = m.createdAt
                    ? new Date(m.createdAt).toLocaleString()
                    : undefined;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : ""}`}
                    >
                      <div
                        className={[
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm ring-1",
                          mine
                            ? "bg-indigo-600 text-white ring-indigo-500/30"
                            : "bg-slate-50 text-slate-800 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700",
                        ].join(" ")}
                      >
                        <div className="mb-1 flex items-center gap-1 text-[11px] opacity-70">
                          {mine ? (
                            <UserIcon className="h-3.5 w-3.5" />
                          ) : (
                            <BotIcon className="h-3.5 w-3.5" />
                          )}
                          {mine ? "Tu" : "MyFitBot"}
                        </div>
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">
                          {m.body}
                        </div>
                        {stamp && (
                          <div
                            className={`mt-1 text-[10px] ${
                              mine
                                ? "text-white/70 text-right"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                            title={title}
                          >
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
                      <span className="opacity-70">
                        MyFitBot sta scrivendo…
                      </span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </main>
          </div>

          {/* Composer */}
          <ChatBotFooter
            isAuthenticated={isAuthenticated}
            activeThreadId={activeThreadId}
            input={input}
            setInput={setInput}
            onSend={onSend}
            sending={sending}
            inputRef={inputRef}
          />
        </div>
      )}
    </>
  );
}
