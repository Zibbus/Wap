// client/src/components/professionisti/ProfileHeader.tsx
import {
  Star,
  ShieldCheck,
  MapPin,
  MessageSquare,
  Circle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Professional } from "../../types/professional";
import { ROLE_LABEL } from "../../types/professional";
import { useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useLoginModal } from "../../hooks/useLoginModal";
import {
  openOrCreateConversationByUsername,
  openOrCreateConversation,
} from "../../services/chat";

type Props = {
  p: Professional;
  onMessage?: () => void;
  onCall?: () => void;
  onVideo?: () => void;
};

const fmtEUR = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default function ProfileHeader({ p, onMessage }: Props) {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const { openLoginModal } = useLoginModal();

  const isAuthenticated: boolean = !!(
    auth?.isAuthenticated ??
    auth?.isLoggedIn ??
    auth?.user ??
    auth?.me
  );

  const price = useMemo(() => {
    const value = Number.isFinite(p.pricePerHour as number)
      ? (p.pricePerHour as number)
      : 0;
    return fmtEUR.format(value);
  }, [p.pricePerHour]);

  const rating =
    typeof p.rating === "number" && Number.isFinite(p.rating) ? p.rating : 0;
  const reviewsCount =
    typeof p.reviewsCount === "number" ? p.reviewsCount : 0;

  async function startConversation() {
    try {
      // 1) preferisci username
      if (p.username && p.username.trim()) {
        const { conversationId } =
          await openOrCreateConversationByUsername(p.username);
        if (Number.isFinite(conversationId)) {
          sessionStorage.setItem("openConversationId", String(conversationId));
          navigate("/chat", { state: { conversationId } });
          return;
        }
      }

      // 2) fallback userId
      const maybeUserId = (p as any).userId ?? (p as any).user?.id ?? null;
      if (Number.isFinite(maybeUserId)) {
        const { conversationId } = await openOrCreateConversation(
          Number(maybeUserId)
        );
        if (Number.isFinite(conversationId)) {
          sessionStorage.setItem("openConversationId", String(conversationId));
          navigate("/chat", { state: { conversationId } });
          return;
        }
      }

      // 3) fallback finale
      navigate("/chat");
    } catch (err) {
      console.error("Errore avvio chat:", err);
      navigate("/chat");
    }
  }

  async function handleContact() {
    // Se non loggato → apri modal e registra un listener "one-shot" sul successo login
    if (!isAuthenticated) {
      const onSuccess = () => {
        // appena il login va a buon fine, avvia direttamente la conversazione
        startConversation();
      };
      window.addEventListener("myfit:login:success", onSuccess, { once: true });
      if (typeof openLoginModal === "function") openLoginModal();
      else if (typeof (window as any).openLoginModal === "function")
        (window as any).openLoginModal();
      return;
    }

    // già loggato → vai diretto
    startConversation();
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={p.avatarUrl || "/images/avatar-fallback.png"}
          alt={`Avatar di ${p.name}`}
          className="h-20 w-20 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
          loading="lazy"
          onError={(e) => {
            if (e.currentTarget.src.endsWith("avatar-fallback.png")) return;
            e.currentTarget.src = "/images/avatar-fallback.png";
          }}
        />
        <span
          className="absolute -bottom-1 -right-1 inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-[10px] font-medium shadow-sm dark:bg-gray-900 dark:border-gray-700"
          title={p.online ? "Online" : "Offline"}
        >
          <Circle
            className={`h-2.5 w-2.5 ${
              p.online ? "text-emerald-500" : "text-gray-400"
            }`}
            fill="currentColor"
          />
          <span
            className={
              p.online
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-500 dark:text-gray-400"
            }
          >
            {p.online ? "Online" : "Offline"}
          </span>
        </span>
      </div>

      {/* Info principali */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-gray-100">
            {p.name}
          </h1>
          {p.verified && (
            <span
              title="Verificato"
              className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800"
            >
              <ShieldCheck className="mr-1 h-4 w-4" /> Verificato
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
          <span>{ROLE_LABEL[p.role]}</span>
          {p.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" aria-hidden />
              {p.city}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1 text-gray-800 dark:text-gray-100">
            <Star className="h-4 w-4 text-amber-500" aria-hidden />
            <span className="font-semibold">{rating.toFixed(1)}</span>
            <span className="text-gray-500 dark:text-gray-400">
              ({reviewsCount} recensioni)
            </span>
          </span>

          <span className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300">
            <strong className="font-semibold">{price}</strong>
            <span className="text-gray-500 dark:text-gray-400">/ h</span>
          </span>
        </div>
      </div>

      {/* Azioni */}
      <div className="flex w-full justify-stretch gap-2 sm:w-auto sm:justify-end">
        <button
          type="button"
          onClick={onMessage ?? handleContact}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:bg-indigo-500 dark:hover:bg-indigo-400 sm:flex-none"
          aria-label={`Invia un messaggio a ${p.name}`}
        >
          <MessageSquare className="h-4 w-4" />
          Messaggia
        </button>
      </div>
    </header>
  );
}
