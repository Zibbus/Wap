// client/src/components/chat/ChatModal.tsx
import { useEffect, useState } from "react";
import { openOrCreateConversation, sendMessage } from "../../services/chat";

type Props = {
  targetUserId: number;
  targetName: string;
  onClose: () => void;
  onOpenChat?: (conversationId: number) => void; // per andare su /chat
};

export default function ChatModal({ targetUserId, targetName, onClose, onOpenChat }: Props) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    try {
      setSending(true);
      // 1) apri/crea conversazione
      const { conversationId } = await openOrCreateConversation(targetUserId);

      // 2) se c'è testo, invia primo messaggio
      const trimmed = body.trim();
      if (trimmed) {
        await sendMessage(conversationId, trimmed);
      }

      setOk("Messaggio inviato!");
      setBody("");
      // 3) apri la pagina chat (se fornita)
      onOpenChat?.(conversationId);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Errore nell'invio del messaggio");
    } finally {
      setSending(false);
    }
  }

  // UX: ESC per chiudere
  useEffect(() => {
    function onEsc(ev: KeyboardEvent) {
      if (ev.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Messaggia {targetName}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Chiudi
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}
        {ok && (
          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            {ok}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Scrivi un messaggio per ${targetName} (facoltativo)`}
            className="h-28 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm dark:border-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {sending ? "Invio…" : "Invia e apri chat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
