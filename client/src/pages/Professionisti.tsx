import { useEffect, useMemo, useState } from "react";
import { listProfessionals } from "../services/professionals";
import type { Professional } from "../types/professional";
import { Filters, List } from "../components/professionisti";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLoginModal } from "../hooks/useLoginModal";

export default function Professionisti() {
  const [items, setItems] = useState<Professional[]>([]);
  const [filters, setFilters] = useState({
    q: "",
    role: "all" as "all" | "personal_trainer" | "nutrizionista",
    onlineOnly: false,
    minRating: 0,
    maxPrice: "" as number | "",
  });

  const navigate = useNavigate();
  const { authData } = useAuth();
  const { openLoginModal } = useLoginModal();

  useEffect(() => { listProfessionals().then(setItems); }, []);

  const filtered = useMemo(() => {
    const { q, role, onlineOnly, minRating, maxPrice } = filters;
    return items.filter(p => {
      if (role !== "all" && p.role !== role) return false;
      if (onlineOnly && !p.online) return false;
      if (minRating && p.rating < minRating) return false;
      if (maxPrice !== "" && p.pricePerHour > Number(maxPrice)) return false;

      const needle = q.trim().toLowerCase();
      if (needle) {
        const hay = `${p.name} ${p.role} ${p.city ?? ""} ${p.specialties.join(" ")} ${p.languages.join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [items, filters]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-extrabold text-indigo-700 mb-6">Professionisti</h1>

      <Filters onChange={setFilters} />

      <List
        items={filtered}
        onOpen={(id) => navigate(`/professionisti/${id}`)}
        onContact={(id) => {
            if (!authData) return openLoginModal();
            navigate(`/chat/${id}`);
        }}
        />
    </div>
  );
}