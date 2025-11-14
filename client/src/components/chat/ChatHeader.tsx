// client/src/components/chat/ChatHeader.tsx
type Peer = { userId: number; name: string; avatarUrl?: string };

type Props = {
  peer: Peer | null;
  onOpenAttachments: () => void;
};

function colorFromString(str?: string | null) {
  if (!str) return "#6366f1";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 75%, 55%)`;
}

export default function ChatHeader({ peer, onOpenAttachments }: Props) {
  if (!peer) return null;

  return (
    <header className="mb-3 sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-b from-white/95 to-white/90 px-1 py-2 dark:border-gray-800 dark:from-slate-900/95 dark:to-slate-900/90">
      <button
        type="button"
        onClick={onOpenAttachments}
        className="group inline-flex items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-indigo-50/80 hover:ring-1 hover:ring-indigo-200 dark:hover:bg-gray-800 dark:hover:ring-indigo-800/40"
        title="Vedi gli allegati di questa conversazione"
      >
        {peer.avatarUrl ? (
          <img
            src={peer.avatarUrl}
            alt={peer.name}
            className="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-white/70 dark:ring-gray-900/70"
            loading="lazy"
          />
        ) : (
          <span
            className="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold uppercase text-white shadow-sm ring-2 ring-white/70 dark:ring-gray-900/70"
            style={{ background: colorFromString(peer.name) }}
            aria-hidden
          >
            {peer.name?.[0] ?? "?"}
          </span>
        )}

        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {peer.name}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Tocca per vedere allegati
          </span>
        </div>
      </button>
    </header>
  );
}
