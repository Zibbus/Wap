// client/src/pages/Professionisti.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listProfessionals } from "../services/professionals";
import type { Professional } from "../types/professional";
import List from "../components/professionisti/List";
import Filters from "../components/professionisti/Filters";
import { useAuth } from "../hooks/useAuth";
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
  const { authData } = useAuth();
  const { openLoginModal } = useLoginModal();

  const [items, setItems] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await listProfessionals(filters);
        if (!stop) setItems(data);
      } catch (e: any) {
        if (!stop) setError(e?.message || "Errore caricamento");
      } finally {
        if (!stop) setLoading(false);
      }
    })();

    return () => { stop = true; };
  }, [filters]);

  const handleOpen = (id: number) => {
    navigate(`/professionisti/${id}`);
  };

  const handleContact = (id: number) => {
    if (!authData) {
      openLoginModal();       // 👈 se non loggato, apri modal
      return;
    }
    // 👇 se loggato, procedi (puoi cambiare rotta verso /chat/:id quando pronta)
    navigate(`/professionisti/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold">Professionisti</h1>

      {/* Filtri: il componente emette tutto in onChange */}
      <div className="mt-6">
        <Filters onChange={setFilters} />
      </div>

      {/* Stato */}
      {loading && <div className="mt-6 text-gray-600">Caricamento…</div>}

      {error && !loading && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          Errore: {error}
        </div>
      )}

      {!loading && !error && (
        <List items={items} onOpen={handleOpen} onContact={handleContact} />
      )}
    </div>
  );
}
