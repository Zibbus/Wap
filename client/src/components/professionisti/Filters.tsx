// client/src/components/professionisti/Filters.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Star } from "lucide-react";

type Role = "all" | "personal_trainer" | "nutrizionista";

type Props = {
  onChange: (filters: {
    q: string;
    role: Role;
    onlineOnly: boolean;
    minRating: number;
    maxPrice: number | "";
  }) => void;
};

/* Debounce utility */
function useDebouncedCallback<T extends (...args: any[]) => void>(cb: T, delay = 300) {
  const t = useRef<number | null>(null);
  return (...args: Parameters<T>) => {
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => cb(...args), delay);
  };
}

export default function Filters({ onChange }: Props) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role>("all");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  const emit = useDebouncedCallback(
    () => onChange({ q, role, onlineOnly, minRating, maxPrice }),
    250
  );

  // Emissione immediata per: ruolo, onlineOnly, minRating (slider)
  useEffect(() => {
    onChange({ q, role, onlineOnly, minRating, maxPrice });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, onlineOnly, minRating]);

  // Debounce per: q, maxPrice
  useEffect(() => {
    emit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, maxPrice]);

  const reset = () => {
    setQ("");
    setRole("all");
    setOnlineOnly(false);
    setMinRating(0);
    setMaxPrice("");
    onChange({ q: "", role: "all", onlineOnly: false, minRating: 0, maxPrice: "" });
  };

  const label = "text-[13px] font-medium text-gray-700 dark:text-gray-200";
  const ratingDisplay = useMemo(
    () => (Math.round(minRating * 2) / 2).toFixed(1).replace(/\.0$/, ""),
    [minRating]
  );
  const priceDisplay = maxPrice === "" ? "Nessun limite" : `${maxPrice} €/h`;

  return (
    <section className="rounded-2xl border border-indigo-50 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:p-5">
      <div className="grid items-end gap-3 md:grid-cols-12 md:gap-4">
        {/* CERCA — pill con glow neon */}
        <div className="md:col-span-6">
          <div
            className="
              group relative mb-2 rounded-full
              bg-white ring-1 ring-indigo-500/15 shadow-sm
              focus-within:ring-2 focus-within:ring-indigo-500/40
              focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.35)]
              dark:bg-[#0b1323] dark:ring-indigo-400/25
              dark:focus-within:ring-indigo-400/50
              dark:focus-within:shadow-[0_0_0_3px_rgba(129,140,248,0.45)]
              transition-shadow
            "
          >
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-indigo-200/70"
              aria-hidden
            />
            <input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onChange({ q, role, onlineOnly, minRating, maxPrice })}
              placeholder="Cerca un professionista nella tua zona…"
              className="
                h-12 w-full rounded-full bg-transparent pl-10 pr-10
                text-[15px] text-gray-800 placeholder:text-gray-400 outline-none
                dark:text-gray-100 dark:placeholder:text-indigo-200/70
              "
            />
            {q && (
              <button
                type="button"
                aria-label="Pulisci ricerca"
                onClick={() => setQ("")}
                className="
                  absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5
                  text-gray-400 hover:bg-gray-100 hover:text-gray-700
                  dark:text-indigo-200/70 dark:hover:bg-[#0f172a] dark:hover:text-indigo-100
                "
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* RUOLO — tendina compatta */}
        <div className="md:col-span-3">
          <label className={label} htmlFor="role">Ruolo</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="
              mb-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none
              transition focus:ring-2 focus:ring-indigo-500
              dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100
            "
          >
            <option value="all">Tutti</option>
            <option value="personal_trainer">Personal Trainer</option>
            <option value="nutrizionista">Nutrizionista</option>
          </select>
        </div>

        {/* MIN RATING — slider con anteprima ⭐ */}
        <div className="md:col-span-1">
          <div className="flex items-center justify-between">
            <label className={label} htmlFor="minRating">Rating</label>
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              <span>{ratingDisplay}</span>
            </div>
          </div>
          <input
            id="minRating"
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="mb-2 w-full accent-indigo-600"
            aria-label="Rating minimo"
          />
        </div>

        {/* PREZZO MAX — slider con valore / nessun limite */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <label className={label} htmlFor="maxPrice">Prezzo max</label>
            <span className="text-xs text-gray-600 dark:text-gray-300">{priceDisplay}</span>
          </div>
          <input
            id="maxPrice"
            type="range"
            min={0}
            max={150}
            step={10}
            value={maxPrice === "" ? 0 : maxPrice}
            onChange={(e) => {
              const v = Number(e.target.value);
              setMaxPrice(v === 0 ? "" : v);
            }}
            className="mb-2 w-full accent-indigo-600"
            aria-label="Prezzo massimo orario"
          />
        </div>

      {/* DISPONIBILITÀ (segmented pill moderno) + RESET */}
      <div className="md:col-span-12 mt-1 flex items-center justify-between">
        <div>
          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200">Disponibilità</span>
          <div
            role="tablist"
            aria-label="Filtro disponibilità"
            className="
              mt-1 inline-flex items-center gap-1 rounded-full border
              border-gray-200 bg-white p-1 shadow-sm
              dark:border-gray-700 dark:bg-gray-900
            "
          >
            {/* Tutti */}
            <button
              role="tab"
              aria-selected={!onlineOnly}
              onClick={() => setOnlineOnly(false)}
              className={`
                rounded-full px-3 py-1.5 text-sm transition
                ${!onlineOnly
                  ? "bg-gray-900 text-white shadow dark:bg-white dark:text-gray-900"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"}
              `}
              title="Mostra tutti"
            >
              Tutti
            </button>

            {/* Online */}
            <button
              role="tab"
              aria-selected={onlineOnly}
              onClick={() => setOnlineOnly(true)}
              className={`
                group relative rounded-full px-3 py-1.5 text-sm transition
                ${onlineOnly
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_4px_18px_rgba(16,185,129,0.35)]"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"}
              `}
              title="Solo professionisti online"
            >
              <span className="inline-flex items-center gap-1.5">
                <svg
                  className={`h-4 w-4 ${onlineOnly ? "opacity-100" : "opacity-70"} transition-opacity`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M8.5 16a6 6 0 0 1 7 0" />
                  <path d="M12 20h.01" />
                </svg>
                Online
                {onlineOnly && (
                  <span className="relative ml-1.5 inline-flex">
                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-white/70 opacity-75"></span>
                    <span className="relative inline-block h-2 w-2 rounded-full bg-white"></span>
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="
            rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800
            hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30
            dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800
          "
          title="Reimposta filtri"
        >
          Reset
        </button>
      </div>
      </div>
    </section>
  );
}
