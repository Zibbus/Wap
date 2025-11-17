// client/src/components/Chatbot/ChatBotSidebar.tsx
import {
  Search,
  Plus,
  FolderPlus,
  Folder,
  FolderOpen,
  Pencil,
  Trash2,
} from "lucide-react";

type AssistantThread = {
  threadId: number;
  title: string | null;
  folderId: number | null;
  lastBody: string | null;
  lastAt: string | null;
  unread: number;
};

type AssistantFolder = {
  id: number;
  name: string;
  createdAt?: string;
};

type ChatBotSidebarProps = {
  // ricerca
  query: string;
  setQuery: (value: string) => void;
  q: string;

  // cartelle
  folders: AssistantFolder[];
  activeFolderId: number | null;
  setActiveFolderId: (id: number | null) => void;
  editingFolderId: number | "new" | null;
  editingFolderName: string;
  setEditingFolderName: (value: string) => void;
  createFolderInline: () => void | Promise<void>;
  submitCreateFolder: () => void | Promise<void>;
  startRenameFolder: (id: number, name: string) => void | Promise<void>;
  submitRenameFolder: (id: number) => void | Promise<void>;
  deleteFolder: (id: number) => void | Promise<void>;

  // threads
  threadsInActiveFolder: AssistantThread[];
  filteredThreads: AssistantThread[];
  activeThreadId: number | null;
  editingThreadId: number | null;
  editingThreadTitle: string;
  setEditingThreadTitle: (value: string) => void;
  startRenameThread: (thread: AssistantThread) => void | Promise<void>;
  submitRenameThread: (threadId: number) => void | Promise<void>;
  deleteThread: (threadId: number) => void | Promise<void>;

  // drag & drop
  dragThreadId: number | null;
  setDragThreadId: (id: number | null) => void;
  moveThread: (threadId: number, folderId: number | null) => void | Promise<void>;

  // handler "esterni" definiti in MyFitBot
  onCreateThread: () => void | Promise<void>;
  onOpenThread: (threadId: number) => void | Promise<void>;
};

export function ChatBotSidebar({
  query,
  setQuery,
  q,
  folders,
  activeFolderId,
  setActiveFolderId,
  editingFolderId,
  editingFolderName,
  setEditingFolderName,
  createFolderInline,
  submitCreateFolder,
  startRenameFolder,
  submitRenameFolder,
  deleteFolder,
  threadsInActiveFolder,
  filteredThreads,
  activeThreadId,
  editingThreadId,
  editingThreadTitle,
  setEditingThreadTitle,
  startRenameThread,
  submitRenameThread,
  deleteThread,
  dragThreadId,
  setDragThreadId,
  moveThread,
  onCreateThread,
  onOpenThread,
}: ChatBotSidebarProps) {
  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-r border-slate-200 p-3 dark:border-slate-700">
      {/* Search + New folder */}
      <div className="mb-3 pl-[0.10rem] flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca titoli e messaggi…"
            className="w-full rounded-md border border-slate-200 bg-white pl-7 pr-2 py-2 text-xs text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900/30"
          />
        </div>
        <button
          onClick={() => void createFolderInline()}
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
          className={[
            "group flex items-center justify-between rounded-md px-2 py-1 text-xs cursor-pointer",
            activeFolderId === null
              ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
              : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
          ].join(" ")}
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

        {/* inline create folder */}
        {editingFolderId === "new" && (
          <div className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800/50">
            <Folder className="h-4 w-4 opacity-60" />
            <input
              autoFocus
              value={editingFolderName}
              onChange={(e) => setEditingFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCreateFolder();
                if (e.key === "Escape") {
                  setEditingFolderName("");
                }
              }}
              onBlur={() => void submitCreateFolder()}
              placeholder="Nome cartella…"
              className="flex-1 bg-transparent text-xs outline-none"
            />
          </div>
        )}

        {/* elenco cartelle */}
        {folders.map((f) => {
          const isEdit = editingFolderId === f.id;
          const isActive = activeFolderId === f.id;
          return (
            <div
              key={f.id}
              className={[
                "group flex items-center justify-between rounded-md px-2 py-1 text-xs cursor-pointer",
                isActive
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
              ].join(" ")}
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
                onDoubleClick={() => void startRenameFolder(f.id, f.name)}
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
                      if (e.key === "Escape") {
                        setEditingFolderName("");
                      }
                    }}
                    onBlur={() => void submitRenameFolder(f.id)}
                    className="flex-1 bg-transparent outline-none"
                  />
                )}
              </button>

              {/* azioni fantasma */}
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!isEdit && (
                  <button
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => void startRenameFolder(f.id, f.name)}
                    title="Rinomina cartella"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={() => void deleteFolder(f.id)}
                  title="Elimina cartella"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview cartella selezionata */}
      {activeFolderId !== null && threadsInActiveFolder.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Anteprima
          </div>
          <div className="space-y-1">
            {threadsInActiveFolder.slice(0, 3).map((t) => (
              <div
                key={t.threadId}
                className="rounded-md border border-slate-200 p-2 text-xs dark:border-slate-700"
              >
                <div className="line-clamp-1 font-medium">
                  {t.title || "Senza titolo"}
                </div>
                <div className="line-clamp-1 opacity-70">
                  {t.lastBody || "—"}
                </div>
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
          onClick={() => void onCreateThread()}
          className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          title="Nuova conversazione"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Threads */}
      <ul className="space-y-1">
        {filteredThreads.map((t) => {
          const isEdit = editingThreadId === t.threadId;
          const isActive = activeThreadId === t.threadId;
          return (
            <li key={t.threadId}>
              <div
                className={[
                  "group flex items-center justify-between rounded-md px-2 py-2 text-xs cursor-pointer border",
                  isActive
                    ? "border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-700/50 dark:bg-indigo-900/30 dark:text-indigo-100"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800",
                ].join(" ")}
                draggable
                onDragStart={() => setDragThreadId(t.threadId)}
                onDragEnd={() => setDragThreadId(null)}
              >
                <div className="flex items-center gap-2">
                  <button
                    className="flex-1 text-left"
                    onClick={() => void onOpenThread(t.threadId)}
                    onDoubleClick={() => void startRenameThread(t)}
                    title="Apri conversazione"
                  >
                    {!isEdit ? (
                      <>
                        <div className="line-clamp-1 font-medium">
                          {t.title || "Senza titolo"}
                        </div>
                        <div className="line-clamp-1 opacity-70">
                          {t.lastBody || "—"}
                        </div>
                      </>
                    ) : (
                      <input
                        autoFocus
                        value={editingThreadTitle}
                        onChange={(e) =>
                          setEditingThreadTitle(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitRenameThread(t.threadId);
                          if (e.key === "Escape") {
                            setEditingThreadTitle("");
                          }
                        }}
                        onBlur={() => void submitRenameThread(t.threadId)}
                        className="w-full rounded-sm border border-slate-300 bg-white px-1 py-0.5 dark:border-slate-600 dark:bg-slate-900"
                      />
                    )}
                  </button>
                </div>

                {/* azioni fantasma */}
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {!isEdit && (
                    <button
                      className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => void startRenameThread(t)}
                      title="Rinomina conversazione"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => void deleteThread(t.threadId)}
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
  );
}
