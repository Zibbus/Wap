// client/src/components/chat/AttachmentsModal.tsx
import { X, Image as ImageIcon, FileText, FileVideo } from "lucide-react";

type Attachment = { id: number; url: string; name: string | null };

type AttachmentsByType = {
  imgs: Attachment[];
  docs: Attachment[];
  video: Attachment[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  peerName?: string;
  attachments: AttachmentsByType;
  activeTab: "images" | "video" | "docs";
  onTabChange: (tab: "images" | "video" | "docs") => void;
};

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
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? "bg-indigo-600 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function AttachmentsModal({
  open,
  onClose,
  peerName,
  attachments,
  activeTab,
  onTabChange,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex h-[80vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/95">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Allegati {peerName ? `con ${peerName}` : ""}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-5 pt-4">
          <TabButton
            active={activeTab === "images"}
            onClick={() => onTabChange("images")}
            icon={<ImageIcon className="h-4 w-4" />}
            label={`Immagini (${attachments.imgs.length})`}
          />
          <TabButton
            active={activeTab === "video"}
            onClick={() => onTabChange("video")}
            icon={<FileVideo className="h-4 w-4" />}
            label={`Video (${attachments.video.length})`}
          />
          <TabButton
            active={activeTab === "docs"}
            onClick={() => onTabChange("docs")}
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
                    >
                      <img
                        src={a.url}
                        alt={a.name || "immagine"}
                        className="h-40 w-full object-cover transition group-hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Nessuna immagine.</p>
              )}
            </section>
          )}

          {activeTab === "video" && (
            <section>
              {attachments.video.length ? (
                <ul className="space-y-2 text-sm">
                  {attachments.video.map((a) => (
                    <li key={a.id}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                      >
                        <FileVideo className="h-4 w-4" />
                        <span className="truncate">{a.name || "Video"}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Nessun video.</p>
              )}
            </section>
          )}

          {activeTab === "docs" && (
            <section>
              {attachments.docs.length ? (
                <ul className="space-y-2 text-sm">
                  {attachments.docs.map((a) => (
                    <li key={a.id}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{a.name || "Documento"}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Nessun documento.</p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
