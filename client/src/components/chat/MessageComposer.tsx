// client/src/components/chat/MessageComposer.tsx
import { Paperclip, X } from "lucide-react";
import { useRef, type ChangeEvent, type KeyboardEvent } from "react";

export type UploadItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

type Props = {
  draft: string;
  setDraft: (value: string) => void;
  uploads: UploadItem[];
  onRemoveUpload: (id: string) => void;
  onFilesSelected: (files: FileList | null) => void;
  onSend: () => void;
  sending: boolean;
  disabled: boolean;
};

export default function MessageComposer({
  draft,
  setDraft,
  uploads,
  onRemoveUpload,
  onFilesSelected,
  onSend,
  sending,
  disabled,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePick = (e: ChangeEvent<HTMLInputElement>) => {
    onFilesSelected(e.target.files);
    e.target.value = "";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !sending) {
        onSend();
      }
    }
  };

  const queuedCount = uploads.filter((u) => u.status === "queued").length;

  return (
    <footer className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-800">
      {/* Lista upload in coda */}
      {uploads.length > 0 && (
        <div className="mb-2 max-h-28 space-y-1 overflow-y-auto pr-1 no-scrollbar">
          {uploads.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1 text-xs dark:bg-slate-800/80"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{u.name}</p>
                <p className="text-[10px] text-slate-500">
                  {(u.size / 1024 / 1024).toFixed(2)} MB · {u.status}
                  {u.error && ` · ${u.error}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveUpload(u.id)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Aggiungi allegati (verranno inviati con il messaggio)"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handlePick}
        />

        <textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio… (Invio invia, Shift+Invio va a capo)"
          className="
            flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm
            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50
            dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100
          "
          style={{ overflowY: "auto" }}
          aria-label="Campo di testo del messaggio"
        />

        <button
          type="button"
          onClick={onSend}
          disabled={disabled || sending}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Invia
        </button>
      </div>

      {queuedCount > 0 && (
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {queuedCount} allegato/i in coda (verranno inviati con il prossimo messaggio).
        </p>
      )}
    </footer>
  );
}
