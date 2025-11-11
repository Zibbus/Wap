// client/src/components/FoodAsyncSelect.tsx
import { useMemo, useRef } from "react";
import AsyncSelect from "react-select/async";
import type { StylesConfig } from "react-select";
import { API_BASE } from "../services/api"; // <— usa base centralizzato

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

type Option = { value: number; label: string; food: FoodApi };

type Props = {
  token?: string | null;
  value?: FoodApi | null;
  onChange: (food: FoodApi | null) => void;
  placeholder?: string;
  className?: string;
};

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
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFoods = async (q: string): Promise<Option[]> => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const hasQuery = q.trim().length > 0;
    const qs = hasQuery
      ? `?query=${encodeURIComponent(q.trim())}&limit=20`
      : `?limit=20`;

    const res = await fetch(`${API_BASE}/foods${qs}`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: ctrl.signal,
    });
    if (!res.ok) return [];
    const data: FoodApi[] = await res.json();
    return data.map((f) => ({ value: f.id, label: f.name, food: f }));
  };

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

  const selected = useMemo<Option | null>(() => {
    return value ? { value: value.id, label: value.name, food: value } : null;
  }, [value]);

  return (
    <AsyncSelect<Option, false>
      cacheOptions
      defaultOptions
      isClearable
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
