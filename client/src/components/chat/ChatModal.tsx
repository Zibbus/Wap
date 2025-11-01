import { useEffect, useState } from "react";
import { openOrCreateConversation, sendMessage } from "../../services/chat";

type Props = {
  targetUserId: number;
  targetName: string;
  onClose: () => void;
  onOpenChat?: (conversationId: number) => void; // per redir alla chat page al volo
};

export default function ChatModal({ targetUserId, targetName, onClose, onOpenChat }: Props) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const canSend = body.trim().length > 0 && !sending;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setSending(true);
    try {
      const { conversationId } = await openOrCreateConversation(targetUserId);
      await sendMessage(conversationId, body.trim());
      setOk("Messaggio inviato! ✨");
      setBody("");
      onOpenChat?.(conversationId);
    } catch (e: any) {
      setError(e?.message || "Errore invio messaggio");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    function onEsc(ev: KeyboardEvent) {
      if (ev.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-indigo-100 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Messaggia {targetName}</h3>
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            Chiudi
          </button>
        </div>

        {error && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
        {ok && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">{ok}</div>}

        <form onSubmit={handleSend}>
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Scrivi il tuo messaggio…"
            className="mb-3 w-full resize-none rounded-lg border border-gray-200 bg-white p-3 text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
              Annulla
            </button>
            <button type="submit" disabled={!canSend} className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {sending ? "Invio…" : "Invia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
