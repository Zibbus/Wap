import { useMemo, useRef } from "react";
import AsyncSelect from "react-select/async";
import type { StylesConfig } from "react-select";
import { API_BASE } from "../services/api"; // base URL centralizzato

// Tipo record alimento restituito dall'API
export type FoodApi = {
  id: number;
  name: string;
  default_unit: "g" | "ml" | "pcs" | "cup" | "tbsp" | "tsp" | "slice";
  kcal_per_100: number | null;
  protein_per_100: number | null;
  carbs_per_100: number | null;
  fat_per_100: number | null;
  fiber_per_100?: number | null;
};

// Option per react-select (porta dietro anche il FoodApi originale)
type Option = { value: number; label: string; food: FoodApi };

// Props del componente
type Props = {
  token?: string | null;        // facoltativo: aggiunge Authorization
  value?: FoodApi | null;       // valore selezionato (controllato)
  onChange: (food: FoodApi | null) => void;
  placeholder?: string;
  className?: string;
};

// Stili leggeri per react-select
const styles: StylesConfig<Option, false> = {
  control: (base) => ({ ...base, minHeight: 38, borderColor: "#c7d2fe" }),
  menu: (base) => ({ ...base, zIndex: 20 }),
};

export default function FoodAsyncSelect({
  token,
  value,
  onChange,
  placeholder = "Cerca alimento…",
  className,
}: Props) {
  // Abort per evitare race condition tra richieste digitate velocemente
  const abortRef = useRef<AbortController | null>(null);
  // Debounce manuale per non pingare l’API ad ogni keypress
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Richiama l'API /foods con limit=20 (sia con query sia senza)
  const fetchFoods = async (q: string): Promise<Option[]> => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const hasQuery = q.trim().length > 0;
    const qs = hasQuery
      ? `?query=${encodeURIComponent(q.trim())}&limit=20`
      : `?limit=20`;

    const res = await fetch(`${API_BASE}/foods${qs}`, {
      credentials: "include",                      // porta cookie/sessione se servono
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: ctrl.signal,
    });
    if (!res.ok) return [];
    const data: FoodApi[] = await res.json();
    return data.map((f) => ({ value: f.id, label: f.name, food: f }));
  };

  // Adapter per AsyncSelect: debounce 300ms e poi callback(options)
  const loadOptions = (inputValue: string, callback: (options: readonly Option[]) => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const options = await fetchFoods(inputValue);
        callback(options);
      } catch {
        callback([]);
      }
    }, 300);
  };

  // Mappa il value controllato (FoodApi) nella Option di react-select
  const selected = useMemo<Option | null>(() => {
    return value ? { value: value.id, label: value.name, food: value } : null;
  }, [value]);

  return (
    <AsyncSelect<Option, false>
      cacheOptions            // cache locale dei risultati per input simili
      defaultOptions          // all'avvio chiama loadOptions("") → primi 20
      isClearable             // mostra "x" per azzerare
      loadOptions={loadOptions}
      value={selected}
      onChange={(opt) => onChange(opt?.food ?? null)}
      placeholder={placeholder}
      className={className}
      styles={styles}
      noOptionsMessage={() => "Nessun alimento trovato"}
    />
  );
}
