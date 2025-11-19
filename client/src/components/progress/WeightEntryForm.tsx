// client/src/components/progress/WeightEntryForm.tsx
import { useState, type FormEvent } from "react";

type Props = {
  onSave: (weight: number) => Promise<void>;
};

export function WeightEntryForm({ onSave }: Props) {
  const [weight, setWeight] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

    async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const value = parseFloat(weight.replace(",", "."));

    // 1) Deve essere un numero
    if (Number.isNaN(value)) {
      setError("Inserisci un valore numerico valido.");
      return;
    }

    // 2) Deve essere maggiore di 0 (controllo di base)
    if (value <= 0) {
      setError("Il peso deve essere maggiore di 0.");
      return;
    }

    // 3) Deve stare in un range sensato (miglioria)
    if (value < 30 || value > 300) {
      setError("Inserisci un peso compreso tra 30 kg e 300 kg.");
      return;
    }

    try {
      setSaving(true);
      await onSave(value);
      setSuccess(true);
      setWeight("");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Errore nel salvataggio del peso";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-200">
            Nuova misurazione del peso (kg)
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Es. 72.5"
              className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              kg
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            La data sarà impostata automaticamente al momento dell&apos;inserimento.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvataggio..." : "Salva peso"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
      {success && !error && (
        <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
          Misurazione salvata con successo.
        </p>
      )}
    </form>
  );
}
