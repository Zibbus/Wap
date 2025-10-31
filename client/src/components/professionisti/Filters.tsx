import { useState } from "react";

type Props = {
  onChange: (filters: {
    q: string;
    role: "all" | "personal_trainer" | "nutrizionista";
    onlineOnly: boolean;
    minRating: number;
    maxPrice: number | "";
  }) => void;
};

export default function Filters({ onChange }: Props) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"all" | "personal_trainer" | "nutrizionista">("all");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  const emit = () => onChange({ q, role, onlineOnly, minRating, maxPrice });

  const inputCls =
    "w-full border rounded-lg px-3 py-2 mt-1 bg-white text-gray-800 border-gray-200 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700";

  const label = "text-sm font-medium text-gray-700 dark:text-gray-200";

  return (
    <div className="bg-white rounded-2xl shadow p-4 border border-indigo-50 flex flex-col md:flex-row gap-3 md:items-end dark:bg-gray-900 dark:border-gray-800">
      <div className="flex-1">
        <label className={label}>Cerca</label>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); }}
          onBlur={emit}
          onKeyDown={(e) => e.key === "Enter" && emit()}
          className={inputCls}
          placeholder="Nome, città, specialità…"
        />
      </div>
      <div>
        <label className={label}>Ruolo</label>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value as any); emit(); }}
          className={inputCls}
        >
          <option value="all">Tutti</option>
          <option value="personal_trainer">Personal Trainer</option>
          <option value="nutrizionista">Nutrizionista</option>
        </select>
      </div>
      <div>
        <label className={label}>Min. rating</label>
        <input
          type="number" min={0} max={5} step={0.1}
          value={minRating}
          onChange={(e) => { setMinRating(Number(e.target.value)); emit(); }}
          className="w-28 border rounded-lg px-3 py-2 mt-1 bg-white text-gray-800 border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
        />
      </div>
      <div>
        <label className={label}>Prezzo max €/h</label>
        <input
          type="number" min={0}
          value={maxPrice}
          onChange={(e) => { setMaxPrice(e.target.value === "" ? "" : Number(e.target.value)); emit(); }}
          className="w-32 border rounded-lg px-3 py-2 mt-1 bg-white text-gray-800 border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
        />
      </div>
      <label className="inline-flex items-center gap-2 select-none md:ml-auto">
        <input
          type="checkbox"
          checked={onlineOnly}
          onChange={(e) => { setOnlineOnly(e.target.checked); emit(); }}
        />
        <span className="text-sm text-gray-700 dark:text-gray-200">Solo online</span>
      </label>
    </div>
  );
}
