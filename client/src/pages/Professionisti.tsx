// client/src/pages/Professionisti.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listProfessionals } from "../services/professionals";
import type { Professional } from "../types/professional";
import List from "../components/professionisti/List";
import Filters from "../components/professionisti/Filters";
import { useAuth } from "../hooks/useAuth";
// Se vuoi aprire il login modal quando non autenticato
import { useLoginModal } from "../hooks/useLoginModal";
import { usePageTitle } from "../hooks/usePageTitle";

import {
  openOrCreateConversationByUsername,
  openOrCreateConversation,
} from "../services/chat";

type FiltersState = {
  q: string;
  role: "all" | "personal_trainer" | "nutrizionista";
  onlineOnly: boolean;
  minRating: number;
  maxPrice: number | "";
};

export default function Professionisti() {
  usePageTitle("Lista dei professionisti");
  const navigate = useNavigate();
  const { requireLogin, authData } = useAuth();
  const { openLoginModal } = useLoginModal();

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

  // ⬇️ Contatta: crea/riusa thread e apri direttamente la chat selezionata
  const handleContact = (id: number) => {
    // se non loggato, apri il modal (se lo usi)
    if (!authData) {
      openLoginModal();
      return;
    }

    const pro = items.find((x) => x.id === id);
    if (!pro) {
      navigate("/chat"); // fallback
      return;
    }

    requireLogin(async () => {
      try {
        let conversationId: number | null = null;

        if (pro.username) {
          ({ conversationId } = await openOrCreateConversationByUsername(pro.username));
        } else if (pro.userId) {
          ({ conversationId } = await openOrCreateConversation(pro.userId));
        }

        if (conversationId) {
          // Passo anche un "peer" facoltativo come placeholder per la colonna sinistra
          navigate("/chat", {
            state: { conversationId, peer: { userId: pro.userId ?? 0, name: pro.name } },
          });
        } else {
          // Se non abbiamo username né userId, apri la chat generica
          console.warn("Professional senza username/userId: aggiungi questi campi al payload API.");
          navigate("/chat");
        }
      } catch (err) {
        console.error("Errore apertura chat:", err);
        navigate("/chat"); // fallback sicuro
      }
    });
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
    </div>
  );
}
