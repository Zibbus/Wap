// client/src/components/Chatbot/ChatBotHeader.tsx
import { Bot as BotIcon, PanelLeftOpen, PanelLeftClose, X } from "lucide-react";

type ChatBotHeaderProps = {
  isAuthenticated: boolean;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onClose: () => void;
};

export function ChatBotHeader({
  isAuthenticated,
  showSidebar,
  onToggleSidebar,
  onClose,
}: ChatBotHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-slate-200 p-3 dark:border-slate-700">
      <div className="flex items-center gap-2">
        <BotIcon className="h-5 w-5 text-indigo-600" />
        <span className="text-sm font-semibold">MyFitBot</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (!isAuthenticated) return;
            onToggleSidebar();
          }}
          disabled={!isAuthenticated}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
          title={
            isAuthenticated
              ? showSidebar
                ? "Chiudi dashboard"
                : "Apri dashboard"
              : "Accedi per usare la dashboard"
          }
        >
          {showSidebar ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
          Dashboard
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Chiudi MyFitBot"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
