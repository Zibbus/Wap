import { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface Product {
  name: string;
  category: string;
}

interface ShopFiltersProps {
  filter: "tutti" | "attrezzi" | "integratori" | "accessori";
  setFilter: (value: "tutti" | "attrezzi" | "integratori" | "accessori") => void;
  search: string;
  setSearch: (value: string) => void;
  products: Product[]; // 🔹 aggiunto per la ricerca dinamica
}

export default function ShopFilters({
  filter,
  setFilter,
  search,
  setSearch,
  products,
}: ShopFiltersProps) {
  const filters = [
    { label: "Tutti", value: "tutti" },
    { label: "Attrezzi", value: "attrezzi" },
    { label: "Integratori", value: "integratori" },
    { label: "Accessori", value: "accessori" },
  ];

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (search.trim().length > 0) {
      const filtered = products
        .map((p) => p.name)
        .filter((name) =>
          name.toLowerCase().includes(search.toLowerCase())
        );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [search, products]);

  const handleSuggestionClick = (value: string) => {
    setSearch(value);
    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative">
      {/* 🔍 Barra di ricerca migliorata */}
      <div className="relative w-full sm:w-1/2 group transition-all">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5 transition-all duration-300 group-focus-within:text-indigo-700" />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca un prodotto..."
          onFocus={() => search && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          className="
            w-full pl-12 pr-5 py-3.5 rounded-full 
            bg-white/95 backdrop-blur-md border border-indigo-300
            shadow-lg text-gray-700 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            transition-all duration-300 hover:shadow-xl
          "
        />

        {/* 💡 Suggerimenti dinamici */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 top-full mt-2 w-full bg-white rounded-2xl border border-indigo-100 shadow-xl z-20 overflow-hidden animate-fadeIn">
            {suggestions.map((s, i) => (
              <li
                key={i}
                onMouseDown={() => handleSuggestionClick(s)}
                className="px-5 py-2 text-gray-700 hover:bg-indigo-50 cursor-pointer transition-colors"
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 🎯 Filtri categoria */}
      <div className="flex flex-wrap justify-center gap-3">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as any)}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
              filter === f.value
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white/80 text-indigo-600 hover:bg-indigo-100 border border-indigo-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 🔹 Animazioni CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
