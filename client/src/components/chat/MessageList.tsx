// client/src/components/chat/MessageList.tsx
import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../services/chat";
import { FileText, Clock, Check, CheckCheck } from "lucide-react";

type Props = {
  messages: ChatMessage[];
  myId: number | null;
};

function getMessageStatus(m: any): "pending" | "sent" | "delivered" | "read" {
  if (m.readAt || m.seenAt || m.read === true || m.status === "read") return "read";
  if (m.deliveredAt || m.delivered === true || m.status === "delivered") return "delivered";
  if (m.sentAt || m.status === "sent") return "sent";
  return "pending";
}

export default function MessageList({ messages, myId }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, myId]);

  return (
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
                  : "bg-slate-50 text-slate-800 ring-slate-200 dark:bg-slate-800/80 dark:text-slate-100 dark:ring-slate-700",
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
                          : "bg-white/70 text-slate-700 hover:bg-white/90 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      {m.attachmentName || "Apri allegato"}
                    </a>
                  )}
                </div>
              )}

              <div
                className={`mt-1 flex items-center gap-1 text-[10px] ${
                  mine ? "text-indigo-100/80" : "text-slate-400 dark:text-slate-400"
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
        <p className="mt-6 text-center text-xs text-slate-400">
          Nessun messaggio in questa conversazione.
        </p>
      )}

      <div ref={bottomRef} />
    </main>
  );
}
