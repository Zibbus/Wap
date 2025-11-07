import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { listConversations, getMessages, sendMessage, type ChatMessage } from "../services/chat";
import { useAuth } from "../hooks/useAuth";
import { Paperclip, FileText, X, FileVideo, Image as ImageIcon, Download, Check, CheckCheck, Clock, Search } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";

/* 👇 uso diretto dell’API client per unread + mark-as-read */
import { api } from "../services/api";
const badgeClass = "inline-block min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-[10px] leading-5 text-white text-center";

/* ---------- Tipi locali ---------- */
type ConversationSummary = {
  conversationId: number;
  peer: { userId: number; name: string; avatarUrl?: string };
  lastBody: string | null;
  lastAt: string | null;
  unread: number;
};

type UploadItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  progress: number; // 0..100
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

/* ---------- Util: iniziali + colore fallback ---------- */
function initialsOf(name?: string) {
  const n = (name || "").trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("") || n[0].toUpperCase();
}
function colorFromString(name?: string) {
  const s = name || "user";
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 45%)`;
}

/* ---------- URL assoluto per path relativi ---------- */
function toAbsoluteUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const viteBase = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  let origin = window.location.origin;
  if (viteBase) {
    try {
      origin = new URL(viteBase, window.location.origin).origin;
    } catch {}
  }
  return path.startsWith("/") ? `${origin}${path}` : `${origin}/${path}`;
}

export default function ChatPage() {
  usePageTitle("Chat");
  const { authData } = useAuth();
  const myId = authData?.userId ?? null;

  if (!authData) return <Navigate to="/" replace />;

  const location = useLocation() as {
    state?: { conversationId?: number; peer?: { userId: number; name: string; avatarUrl?: string } };
  };
  const requestedId = location.state?.conversationId ?? null;

  const [convs, setConvs] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  /* 🔔 unread globali */
  const [unreadByThread, setUnreadByThread] = useState<Record<number, number>>({});
  const unreadTotal = useMemo(
    () => Object.values(unreadByThread).reduce((a, b) => a + (Number(b) || 0), 0),
    [unreadByThread]
  );

  /* Drag & Drop / Upload multipli */
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Popup allegati + TAB */
  const [showAttachments, setShowAttachments] = useState(false);
  type TabKey = "images" | "video" | "docs";
  const [activeTab, setActiveTab] = useState<TabKey>("images");

  /* Ricerca conversazioni */
  const [query, setQuery] = useState("");

  /* anchor per auto-scroll */
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, activeId]);

  /* Helpers */
  async function reloadConversations() {
    const raw = await listConversations();
    const list: ConversationSummary[] = raw.map((c: any) => ({
      conversationId: c.threadId,
      peer: {
        userId: c.otherUserId,
        name: c.otherUsername,
        avatarUrl: toAbsoluteUrl(c.otherAvatarUrl || c.avatar_url),
      },
      lastBody: c.lastBody,
      lastAt: c.lastAt,
      unread: Number(c.unread || 0),
    }));
    setConvs(list);

    // sync anche la mappa locale unread
    const map: Record<number, number> = {};
    for (const it of list) map[it.conversationId] = Number(it.unread || 0);
    setUnreadByThread(map);

    return list;
  }

  /* 🔔 lettura unread (on load + polling) */
  async function refreshUnread() {
    try {
      // ✅ niente doppio /api: il client api ha già il base URL
      const data = await api.get<{ total: number; byThread: Record<number, number> }>("/chat/unread");
      setUnreadByThread(data.byThread || {});
    } catch {
      // ignora errori di polling
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await reloadConversations();

        // ✅ Apri automaticamente SOLO se arrivi con uno state.conversationId valido
        if (requestedId && list.some((c) => c.conversationId === requestedId)) {
          setActiveId(requestedId);
        } else {
          // Altrimenti non selezionare nulla: l'utente deve cliccare dalla lista
          setActiveId(null);
        }

        await refreshUnread();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedId]);

  /* 🔁 polling unread ogni 10s */
  useEffect(() => {
    let t: number | undefined;
    const tick = async () => {
      await refreshUnread();
      t = window.setTimeout(tick, 10000);
    };
    tick();
    return () => {
      if (t) clearTimeout(t);
    };
  }, []);

  /* caricamento messaggi + mark as read */
  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const msgs = await getMessages(activeId);
      setMessages(msgs);

      // segna come letto sul backend
      try {
        // ✅ endpoint normalizzato
        await api.post("/chat/read", { threadId: activeId });
        // 🔔 aggiorna subito badge in header
        window.dispatchEvent(new CustomEvent("myfit:unread:refresh"));
      } catch {}

      // ricarica le conversazioni per aggiornare i badge locali
      await reloadConversations();
    })();
  }, [activeId]);

  /* invio */
  async function onSend() {
    if (!activeId || sending) return;

    const text = draft.trim();
    const pending = uploads.filter((u) => u.status === "queued");
    if (!text && pending.length === 0) return;

    try {
      setSending(true);

      if (text && pending.length === 0) {
        await sendMessage(activeId, text);
        setDraft("");
        const msgs = await getMessages(activeId);
        setMessages(msgs);
        await reloadConversations();
        await refreshUnread();
        return;
      }

      await uploadFilesBatch(activeId, pending, text);
      setUploads((prev) => prev.filter((u) => u.status !== "done"));
      if (text) setDraft("");
      await reloadConversations();
      await refreshUnread();
    } finally {
      setSending(false);
    }
  }

  /* DnD accoda */
  function onDragEnter(e: React.DragEvent) { e.preventDefault(); setIsDragging(true); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); if (!isDragging) setIsDragging(true); }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    const current = e.currentTarget as HTMLElement;
    if (current.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;
    queueFiles(files);
  }

  /* input file → accoda */
  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    queueFiles(files);
  }

  /* Accoda file */
  function queueFiles(files: File[]) {
    const items: UploadItem[] = files.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
      previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      progress: 0,
      status: "queued",
    }));
    setUploads((prev) => [...prev, ...items]);
  }

  /* Upload batch */
  function getAuthToken(): string | null {
    try {
      const saved = localStorage.getItem("authData");
      if (!saved) return null;
      return JSON.parse(saved)?.token ?? null;
    } catch {
      return null;
    }
  }

  function uploadSingleFile(conversationId: number, item: UploadItem, textForThisFile?: string) {
    return new Promise<void>((resolve) => {
      const base = (import.meta as any).env?.VITE_API_BASE ?? "/api";
      const url = `${base}/chat/${conversationId}/attachments`;

      const form = new FormData();
      form.append("file", item.file);
      if (textForThisFile && textForThisFile.trim()) form.append("text", textForThisFile.trim());

      const token = getAuthToken();

      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.withCredentials = true;
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (ev) => {
        if (!ev.lengthComputable) return;
        const pct = Math.round((ev.loaded / ev.total) * 100);
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: "uploading", progress: pct } : u))
        );
      };

      xhr.onreadystatechange = async () => {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const payload = JSON.parse(xhr.responseText);
            const message: ChatMessage | undefined = payload?.message;
            setUploads((prev) =>
              prev.map((u) => (u.id === item.id ? { ...u, progress: 100, status: "done" } : u))
            );
            if (message) setMessages((prev) => [...prev, message]);
          } catch {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === item.id ? { ...u, status: "error", error: "Risposta non valida dal server" } : u
              )
            );
          }
          resolve();
        } else {
          const errMsg = xhr.responseText || `HTTP ${xhr.status} ${xhr.statusText}`;
          setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, status: "error", error: errMsg } : u)));
          resolve();
        }
      };

      xhr.onerror = () => {
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: "error", error: "Errore di rete" } : u))
        );
        resolve();
      };

      xhr.send(form);
    });
  }

  async function uploadFilesBatch(conversationId: number, files: UploadItem[], textOnce?: string) {
    const [first, ...rest] = files;
    const tasks: Promise<void>[] = [];
    if (first) tasks.push(uploadSingleFile(conversationId, first, textOnce));
    for (const f of rest) tasks.push(uploadSingleFile(conversationId, f));
    await Promise.all(tasks);
  }

  /* Remove da coda */
  function removeUpload(id: string) {
    setUploads((prev) => {
      const toRemove = prev.find((u) => u.id === id);
      if (toRemove?.previewUrl) URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter((u) => u.id !== id);
    });
  }

  /* Invio con Enter */
  function onDraftKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  const activePeer = useMemo(
    () => convs.find((c) => c.conversationId === activeId)?.peer,
    [convs, activeId]
  );

  /* Raccolta allegati per tipo */
  const attachments = useMemo(() => {
    type Att = { id: number; url: string; name: string; mime: string; createdAt: string };
    const imgs: Att[] = [];
    const docs: Att[] = [];
    const video: Att[] = [];
    const isDocByExt = (name: string) => /\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(name);

    messages.forEach((m) => {
      if (!m.attachmentUrl) return;
      const mime = (m.attachmentMime || "").toLowerCase();
      const name = m.attachmentName || m.attachmentUrl.split("/").pop() || "allegato";
      const item: Att = { id: m.id, url: m.attachmentUrl, name, mime, createdAt: m.createdAt };

      if (mime.startsWith("image/")) imgs.push(item);
      else if (mime.startsWith("video/")) video.push(item);
      else if (/(pdf|msword|officedocument|text|spreadsheet|presentation)/.test(mime) || isDocByExt(name)) docs.push(item);
    });

    return { imgs, docs, video };
  }, [messages]);

  /* Stato messaggio */
  function getMessageStatus(m: any): "pending" | "sent" | "delivered" | "read" {
    if (m.readAt || m.seenAt || m.read === true || m.status === "read") return "read";
    if (m.deliveredAt || m.delivered === true || m.status === "delivered") return "delivered";
    if (m.pending === true || m.status === "pending" || String(m.id || "").startsWith("temp")) return "pending";
    return "sent";
  }

  /* Filtro conversazioni (per nome o ultimo messaggio) */
  const { filteredConvs, hasQuery } = useMemo(() => {
  const q = query.trim().toLowerCase();
  const hasQuery = q.length > 0;

    const filtered = hasQuery
      ? convs.filter(c => {
          const name = c.peer.name?.toLowerCase() || "";
          const last = c.lastBody?.toLowerCase() || "";
          return name.includes(q) || last.includes(q);
        })
      : convs;

    return { filteredConvs: filtered, hasQuery };
  }, [convs, query]);

  if (loading) {
    return <div className="mx-auto max-w-5xl px-6 py-12">Caricamento…</div>;
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 h-dvh md:h-[calc(100dvh-140px)] md:grid-cols-12 overflow-hidden">
      {/* Lista conversazioni */}
      <aside className="h-full overflow-hidden rounded-2xl border border-indigo-50 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 md:col-span-4">
        {/* Search bar */}
        <div className="mb-2 px-2">
          <label className="sr-only" htmlFor="chat-search">Cerca conversazioni</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="chat-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca per nome o messaggio…"
              className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm outline-none ring-0 transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-800 dark:focus:ring-indigo-900/30"
            />
          </div>
        </div>

        <h2 className="mb-2 px-2 text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          Conversazioni
          {unreadTotal > 0 && (
          <span className={badgeClass}>
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
          )}
        </h2>
        <div className="h-[calc(100%-76px)] overflow-y-auto no-scrollbar pr-1">
          <ul className="space-y-1">
            {filteredConvs.map((c) => {
              const unread = (unreadByThread[c.conversationId] ?? c.unread ?? 0);
              return (
                <li key={c.conversationId}>
                  <button
                    type="button"
                    onClick={() => setActiveId(c.conversationId)}
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
                        <span
                          className="grid h-8 w-8 place-items-center rounded-full text-white text-xs font-semibold ring-2 ring-white/70 dark:ring-gray-900/70"
                          style={{ background: colorFromString(c.peer.name) }}
                          aria-hidden
                        >
                          {initialsOf(c.peer.name)}
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate font-medium text-gray-900 dark:text-gray-100">{c.peer.name}</span>
                          <div className="ml-3 flex items-center gap-2">
                            {unread > 0 && (
                              <span className={badgeClass} aria-label={`${unread} messaggi non letti`}>
                                {unread > 99 ? "99+" : unread}
                              </span>
                            )}
                            {c.lastAt && (
                              <time className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                                {new Date(c.lastAt).toLocaleString("it-IT")}
                              </time>
                            )}
                          </div>
                        </div>
                        <div className="truncate text-xs text-gray-600 dark:text-gray-300">
                          {c.lastBody ?? "—"}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}

            {hasQuery && filteredConvs.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Nessun risultato per “{query}”.
              </li>
            )}
          </ul>
        </div>
      </aside>

      {/* Area messaggi */}
      <section
        className="relative flex h-full flex-col rounded-2xl border border-indigo-50 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 md:col-span-8 overflow-hidden"
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Overlay drag */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-400/80 bg-indigo-500/5 backdrop-blur-[1px] pointer-events-none">
            <div className="rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-indigo-700 shadow dark:bg-gray-900/90 dark:text-indigo-300">
              Rilascia i file qui per <b>accodarli</b> (verranno inviati quando premi Invia)
            </div>
          </div>
        )}

        {activeId ? (
          <>
            {/* HEADER: Avatar + Nome — clic apre allegati */}
            <header className="mb-3 sticky top-0 z-10 border-b border-gray-200 from-indigo-50 to-transparent pb-2 pl-1 pr-1 dark:border-gray-800 dark:from-indigo-950/30 dark:to-transparent">
              <button
                type="button"
                onClick={() => { setActiveTab("images"); setShowAttachments(true); }}
                className="group inline-flex items-center gap-3 rounded-xl px-2 py-1 ring-1 ring-transparent transition hover:bg-white hover:ring-indigo-200 dark:hover:bg-gray-800 dark:hover:ring-indigo-800/40"
                title="Vedi gli allegati di questa conversazione"
              >
                {activePeer?.avatarUrl ? (
                  <img
                    src={activePeer.avatarUrl}
                    alt={activePeer.name}
                    className="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-white/70 dark:ring-gray-900/70"
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full text-white shadow-sm ring-2 ring-white/70 dark:ring-gray-900/70"
                    style={{ background: colorFromString(activePeer?.name) }}
                    aria-hidden
                  >
                    <span className="text-sm font-semibold leading-none">{initialsOf(activePeer?.name)}</span>
                  </span>
                )}
                <span className="flex min-w-0 flex-col text-left">
                  <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-300">
                    {activePeer?.name ?? "—"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Tocca per vedere allegati</span>
                </span>
              </button>
            </header>

            {/* MESSAGGI */}
            <main className="mb-3 flex-1 space-y-3 overflow-y-auto pr-1 no-scrollbar">
              {messages.map((m) => {
                const mine = myId != null && m.senderId === myId;
                const isImage = m.attachmentMime?.startsWith?.("image/");
                const status = mine ? getMessageStatus(m as any) : null;

                return (
                  <article
                    key={m.id}
                    className={`group relative ${mine ? "flex justify-end" : "flex justify-start"}`}
                  >
                    <div
                      className={[
                        "inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ring-1 transition",
                        mine
                          ? "bg-indigo-600 text-white ring-indigo-500/20"
                          : "bg-slate-50 text-slate-800 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700",
                      ].join(" ")}
                    >
                      {m.body && (
                        <div className={mine ? "prose-invert" : ""} style={{ wordBreak: "break-word" }}>
                          <div className="whitespace-pre-wrap wrap-break-word [&_a]:underline [&_a:hover]:opacity-90">
                            {m.body}
                          </div>
                        </div>
                      )}

                      {m.attachmentUrl && (
                        <div className="mt-2">
                          {isImage ? (
                            <img
                              src={m.attachmentUrl}
                              alt={m.attachmentName || "allegato"}
                              className={`max-h-64 max-w-full rounded-xl object-contain ${
                                mine ? "ring-1 ring-white/30" : "ring-1 ring-slate-200 dark:ring-slate-700"
                              }`}
                              loading="lazy"
                            />
                          ) : (
                            <a
                              href={m.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium underline decoration-1 ${
                                mine
                                  ? "hover:bg-white/10"
                                  : "bg-white/70 text-slate-700 hover:bg-white dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
                              }`}
                            >
                              <FileText className="h-4 w-4" />
                              {m.attachmentName || "Apri allegato"}
                            </a>
                          )}
                        </div>
                      )}

                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                          mine ? "text-white/70" : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <span>{new Date(m.createdAt).toLocaleString("it-IT")}</span>
                        {status && (
                          <>
                            {status === "pending" && <Clock className="h-3.5 w-3.5 opacity-80" />}
                            {status === "sent" && <Check className="h-3.5 w-3.5 opacity-80" />}
                            {status === "delivered" && <CheckCheck className="h-3.5 w-3.5 opacity-80" />}
                            {status === "read" && (
                              <CheckCheck
                                className={`h-3.5 w-3.5 ${
                                  mine ? "text-white" : "text-indigo-600 dark:text-indigo-400"
                                }`}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

              {messages.length === 0 && (
                <div className="rounded-xl bg-gray-50 p-3 text-center text-sm text-gray-500 dark:bg-gray-800/40 dark:text-gray-400">
                  Nessun messaggio.
                </div>
              )}

              <div ref={bottomRef} />
            </main>

            {/* Upload in coda */}
            {uploads.length > 0 && (
              <div className="mb-3 grid max-h-48 grid-cols-2 gap-3 overflow-y-auto no-scrollbar md:grid-cols-3">
                {uploads.map((u) => {
                  const isImg = u.type.startsWith("image/");
                  return (
                    <div key={u.id} className="relative rounded-2xl border border-gray-200 p-2 dark:border-gray-700">
                      {u.status !== "uploading" && (
                        <button
                          onClick={() => removeUpload(u.id)}
                          className="absolute right-1 top-1 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                          title="Rimuovi"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        {isImg && u.previewUrl ? (
                          <img
                            src={u.previewUrl}
                            alt={u.name}
                            className="h-14 w-14 rounded object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded bg-gray-100 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
                            <FileText className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{u.name}</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            {(u.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 h-2 w-full overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-2 transition-all ${
                            u.status === "error"
                              ? "bg-red-500"
                              : u.status === "done"
                              ? "bg-emerald-500"
                              : u.status === "uploading"
                              ? "bg-indigo-500"
                              : "bg-gray-400"
                          }`}
                          style={{ width: `${u.progress}%` }}
                        />
                      </div>

                      <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">
                        {u.status === "queued" && "In coda (verrà inviato con il messaggio)…"}
                        {u.status === "uploading" && `Caricamento… ${u.progress}%`}
                        {u.status === "done" && "Completato"}
                        {u.status === "error" && (u.error || "Errore")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer: input */}
            <footer className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Aggiungi allegati (verranno inviati con il messaggio)"
                className="rounded-xl border border-gray-200 bg-white p-2 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                disabled={!activeId || sending}
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                multiple
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                onChange={onPickFile}
              />

              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onDraftKeyDown}
                placeholder="Scrivi un messaggio… (Enter invia, Shift+Enter va a capo)"
                rows={1}
                className="
                  no-scrollbar
                  h-12 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50
                  dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100
                "
                style={{ overflowY: "auto" }}
                aria-label="Campo di testo del messaggio"
              />

              <button
                type="button"
                onClick={onSend}
                disabled={
                  sending ||
                  (!draft.trim() && uploads.filter((u) => u.status === "queued").length === 0) ||
                  !activeId
                }
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Invia
              </button>
            </footer>

            {/* MODAL ALLEGATI */}
            {showAttachments && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowAttachments(false)} />
                <div className="relative z-10 w-full max-w-5xl max-h-[92vh] rounded-2xl border border-slate-200/70 bg-white/98 shadow-2xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/95 flex flex-col">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Allegati — {activePeer?.name ?? "—"}
                    </h4>
                    <button
                      onClick={() => setShowAttachments(false)}
                      className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                      aria-label="Chiudi"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 px-5 pt-4">
                    <TabButton
                      active={activeTab === "images"}
                      onClick={() => setActiveTab("images")}
                      icon={<ImageIcon className="h-4 w-4" />}
                      label={`Immagini (${attachments.imgs.length})`}
                    />
                    <TabButton
                      active={activeTab === "video"}
                      onClick={() => setActiveTab("video")}
                      icon={<FileVideo className="h-4 w-4" />}
                      label={`Video (${attachments.video.length})`}
                    />
                    <TabButton
                      active={activeTab === "docs"}
                      onClick={() => setActiveTab("docs")}
                      icon={<FileText className="h-4 w-4" />}
                      label={`Documenti (${attachments.docs.length})`}
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 pt-4 no-scrollbar">
                    {activeTab === "images" && (
                      <section>
                        {attachments.imgs.length ? (
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                            {attachments.imgs.map((a) => (
                              <a
                                key={a.id}
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                                title={a.name}
                              >
                                <div className="aspect-video w-full overflow-hidden">
                                  <img
                                    src={a.url}
                                    alt={a.name}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="truncate px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                                  {a.name}
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <EmptyState label="Nessuna immagine." />
                        )}
                      </section>
                    )}

                    {activeTab === "video" && (
                      <section>
                        {attachments.video.length ? (
                          <ul className="grid grid-cols-1 gap-3">
                            {attachments.video.map((a) => (
                              <li
                                key={a.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                              >
                                <span className="min-w-0 truncate text-sm text-slate-800 dark:text-slate-200">
                                  {a.name}
                                </span>
                                <a
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                                >
                                  <Download className="h-4 w-4" /> Apri
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <EmptyState label="Nessun video." />
                        )}
                      </section>
                    )}

                    {activeTab === "docs" && (
                      <section>
                        {attachments.docs.length ? (
                          <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
                            {attachments.docs.map((a) => (
                              <li key={a.id} className="flex items-center justify-between gap-2 px-4 py-3">
                                <div className="min-w-0 truncate text-sm text-slate-800 dark:text-slate-200">{a.name}</div>
                                <a
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                                >
                                  <Download className="h-4 w-4" /> Apri
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <EmptyState label="Nessun documento." />
                        )}
                      </section>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Seleziona una conversazione.</div>
        )}
      </section>
    </div>
  );
}

/* ---------- Componenti interni ---------- */
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition
        ${
          active
            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {label}
    </div>
  );
}
