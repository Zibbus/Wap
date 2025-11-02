// client/src/pages/Professionisti.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listProfessionals } from "../services/professionals";
import type { Professional } from "../types/professional";
import List from "../components/professionisti/List";
import Filters from "../components/professionisti/Filters";
import { useAuth } from "../hooks/useAuth";
import ChatModal from "../components/chat/ChatModal";
// CHANGED: serve per aprire il modal di login se non autenticato
import { useLoginModal } from "../hooks/useLoginModal";

type FiltersState = {
  q: string;
  role: "all" | "personal_trainer" | "nutrizionista";
  onlineOnly: boolean;
  minRating: number;
  maxPrice: number | "";
};

export default function Professionisti() {
  const navigate = useNavigate();
  const { requireLogin, authData } = useAuth(); // CHANGED: uso anche authData
  const { openLoginModal } = useLoginModal();   // CHANGED

  const [items, setItems] = useState<Professional[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FiltersState>({
    q: "",
    role: "all",
    onlineOnly: false,
    minRating: 0,
    maxPrice: "",
  });

  // CHANGED: target per ChatModal (compose)
  const [composeTarget, setComposeTarget] = useState<{ userId: number; name: string } | null>(null);

  useEffect(() => {
    let stop = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listProfessionals(filters);
        if (!stop) setItems(data);
      } catch (e: any) {
        if (!stop) setError(e?.message || "Errore caricamento");
      } finally {
        if (!stop) setLoading(false);
      }
    })();

    return () => {
      stop = true;
    };
  }, [filters]);

  const handleOpen = (id: number) => {
    navigate(`/professionisti/${id}`);
  };

  // CHANGED: nuova logica "Contatta" con compose e login modal
  const handleContact = (id: number) => {
    if (!authData) {
      openLoginModal();
      return;
    }
    const p = items.find((x) => x.id === id);
    if (!p) return;

    if (!("userId" in p) || !p.userId) {
      console.warn("Professional senza userId: aggiungi userId nel payload dell'API");
      // fallback: usa la rotta /chat (nel tuo App.tsx esiste /chat, non /chat/:id)
      return requireLogin(() => navigate(`/chat`)); // CHANGED
    }

    setComposeTarget({ userId: p.userId, name: p.name });
  };

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-gray-100">
      <h1 className="text-2xl md:text-3xl font-semibold">Professionisti</h1>

      {/* Filtri */}
      <div className="mt-6">
        <div className="rounded-2xl border border-indigo-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <Filters onChange={(next) => setFilters(next)} />
        </div>
      </div>

      {/* Stato */}
      {loading && <div className="mt-6 text-gray-600 dark:text-gray-300">Caricamento…</div>}

      {error && !loading && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          Errore: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6">
          <List items={items} onOpen={handleOpen} onContact={handleContact} />
        </div>
      )}

      {/* CHANGED: Chat compose modal */}
      {composeTarget && (
        <ChatModal
          targetUserId={composeTarget.userId}
          targetName={composeTarget.name}
          onClose={() => setComposeTarget(null)}
          onOpenChat={() => navigate(`/chat`)} // CHANGED: vai su /chat (la tua rotta esistente)
        />
      )}
    </div>
  );
}
