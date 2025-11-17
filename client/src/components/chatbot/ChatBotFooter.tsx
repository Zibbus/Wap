// client/src/components/Chatbot/ChatBotFooter.tsx
import type { RefObject } from "react";
import { Send } from "lucide-react";

type ChatBotFooterProps = {
  isAuthenticated: boolean;
  activeThreadId: number | null;
  input: string;
  setInput: (value: string) => void;
  // stessa firma di onSend in MyFitBot: (e?: React.FormEvent) => Promise<void> | void
  onSend: (e?: React.FormEvent) => void | Promise<void>;
  sending: boolean;
  // 🔧 QUI LA FIX: permettiamo anche `null`
  inputRef: RefObject<HTMLTextAreaElement | null>;
};

export function ChatBotFooter({
  isAuthenticated,
  activeThreadId,
  input,
  setInput,
  onSend,
  sending,
  inputRef,
}: ChatBotFooterProps) {
  return (
    <footer className="flex items-center gap-2 border-t border-slate-200 p-2 dark:border-slate-700">
      <textarea
        ref={inputRef}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          isAuthenticated
            ? activeThreadId
              ? "Scrivi un messaggio…"
              : "Crea o seleziona una conversazione…"
            : "Scrivi un messaggio… (accedi per inviare)"
        }
        className="h-10 flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900/30"
        onKeyDown={(e) => {
          if (!isAuthenticated) return;
          // Invio = manda, Shift+Invio = vai a capo
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void onSend(); // come nel MyFitBot originale
          }
        }}
      />
      <button
        type="button"
        onClick={() => void onSend()}
        disabled={sending || !input.trim() || !isAuthenticated}
        title={
          !isAuthenticated
            ? "Accedi per inviare"
            : activeThreadId
            ? "Invia"
            : "Crea nuova conversazione e invia"
        }
        className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
      </button>
    </footer>
  );
}
