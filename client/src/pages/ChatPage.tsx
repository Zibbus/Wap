import { useEffect, useMemo, useState } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { listConversations, getMessages, sendMessage, type ChatMessage } from "../services/chat";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";

/* API client */
import { api } from "../services/api";

/* Componenti chat */
import ConversationList from "../components/chat/ConversationList";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import MessageComposer, { type UploadItem } from "../components/chat/MessageComposer";
import AttachmentsModal from "../components/chat/AttachmentsModal";

/* ---------- Tipi locali ---------- */
type ConversationSummary = {
  conversationId: number;
  peer: { userId: number; name: string; avatarUrl?: string };
  lastBody: string | null;
  lastAt: string | null;
  unread: number;
};

/* ---------- URL assoluto per path relativi ---------- */
function toAbsoluteUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const viteBase = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  let origin = window.location.origin;
  if (viteBase) {
    try {
      origin = new URL(viteBase, window.location.origin).origin;
    } catch {
      // ignore
    }
  }
  return path.startsWith("/") ? `${origin}${path}` : `${origin}/${path}`;
}

export default function ChatPage() {
  usePageTitle("Chat");
  const { authData } = useAuth();
  const navigate = useNavigate();

  // Redirect reattivo se l'utente fa logout mentre è su /chat
  useEffect(() => {
    if (!authData) {
      sessionStorage.removeItem("openConversationId");
      navigate("/", { replace: true });
    }
  }, [authData, navigate]);

  const myId = authData?.userId != null ? Number(authData.userId) : null;

  // redirect se non loggato
  if (!authData) return <Navigate to="/" replace />;

  const location = useLocation() as {
    state?: { conversationId?: number; peer?: { userId: number; name: string; avatarUrl?: string } };
  };

  // legge dallo state o dal fallback in sessionStorage
  const requestedIdFromState = location.state?.conversationId ?? null;
  const requestedIdFromSession = (() => {
    const v = sessionStorage.getItem("openConversationId");
    return v ? Number(v) : null;
  })();
  const requestedId = requestedIdFromState || requestedIdFromSession || null;

  const [convs, setConvs] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  /* 🔔 unread globali */
  const [unreadByThread, setUnreadByThread] = useState<Record<number, number>>({});

  /* Drag & Drop / Upload multipli */
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  /* Popup allegati + TAB */
  const [showAttachments, setShowAttachments] = useState(false);
  type TabKey = "images" | "video" | "docs";
  const [activeTab, setActiveTab] = useState<TabKey>("images");

  /* Ricerca conversazioni */
  const [query, setQuery] = useState("");

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

        // Apri automaticamente SOLO se arrivi con un id valido
        if (requestedId && list.some((c) => c.conversationId === requestedId)) {
          setActiveId(requestedId);
        } else {
          // altrimenti niente selezione: l’utente sceglie dalla lista
          setActiveId(null);
        }

        // pulisci il fallback per non riaprire sempre
        if (requestedIdFromSession) {
          sessionStorage.removeItem("openConversationId");
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
        await api.post("/chat/read", { threadId: activeId });
        // 🔔 aggiorna subito badge in header
        window.dispatchEvent(new CustomEvent("myfit:unread:refresh"));
      } catch {
        // ignore
      }

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
  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  }
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

      xhr.onreadystatechange = () => {
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
                u.id === item.id
                  ? { ...u, status: "error", error: "Risposta non valida dal server" }
                  : u
              )
            );
          }
          resolve();
        } else {
          const errMsg = xhr.responseText || `HTTP ${xhr.status} ${xhr.statusText}`;
          setUploads((prev) =>
            prev.map((u) => (u.id === item.id ? { ...u, status: "error", error: errMsg } : u))
          );
          resolve();
        }
      };

      xhr.onerror = () => {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === item.id ? { ...u, status: "error", error: "Errore di rete" } : u
          )
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

  const activePeer = useMemo(
    () => convs.find((c) => c.conversationId === activeId)?.peer,
    [convs, activeId]
  );

  /* Raccolta allegati per tipo (blindata per evitare crash runtime) */
  const attachments = useMemo(() => {
    type Att = { id: number; url: string; name: string | null };
    const imgs: Att[] = [];
    const docs: Att[] = [];
    const video: Att[] = [];

    const isDocByExt = (name: string) =>
      /\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(name);

    messages.forEach((m) => {
      if (!m.attachmentUrl || typeof m.attachmentUrl !== "string") return;

      const url = m.attachmentUrl;
      const mime = (m.attachmentMime || "").toLowerCase();
      const fromUrl = typeof url === "string" ? url.split("/").pop() || undefined : undefined;
      const name = m.attachmentName || fromUrl || "allegato";

      const item: Att = { id: m.id, url, name };

      if (mime.startsWith("image/")) {
        imgs.push(item);
      } else if (mime.startsWith("video/")) {
        video.push(item);
      } else if (
        /(pdf|msword|officedocument|text|spreadsheet|presentation)/.test(mime) ||
        isDocByExt(name)
      ) {
        docs.push(item);
      }
    });

    return { imgs, docs, video };
  }, [messages]);

  if (loading) {
    return <div className="mx-auto max-w-5xl px-6 py-12">Caricamento…</div>;
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 h-dvh md:h-[calc(100dvh-140px)] md:grid-cols-12 overflow-hidden">
      {/* Sidebar conversazioni */}
      <ConversationList
        conversations={convs}
        unreadByThread={unreadByThread}
        activeId={activeId}
        query={query}
        onQueryChange={setQuery}
        onSelectConversation={(id) => setActiveId(id)}
      />

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
            <ChatHeader
              peer={activePeer ?? null}
              onOpenAttachments={() => {
                setActiveTab("images");
                setShowAttachments(true);
              }}
            />

            <MessageList messages={messages} myId={myId} />

            <MessageComposer
              draft={draft}
              setDraft={setDraft}
              uploads={uploads}
              onRemoveUpload={removeUpload}
              onFilesSelected={(files) => {
                if (!files) return;
                queueFiles(Array.from(files));
              }}
              onSend={onSend}
              sending={sending}
              disabled={!activeId}
            />
          </>
        ) : (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
            Seleziona una conversazione.
          </div>
        )}

        <AttachmentsModal
          open={showAttachments}
          onClose={() => setShowAttachments(false)}
          peerName={activePeer?.name}
          attachments={attachments}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </section>
    </div>
  );
}
