// client/src/pages/ProgressPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { useWeightHistory, type WeightPoint } from "../hooks/useWeightHistory";
import { WeightSummary, type WeightStats } from "../components/progress/WeightSummary";
import { WeightChart } from "../components/progress/WeightChart";
import { WeightEntryForm } from "../components/progress/WeightEntryForm";
import { WeightEmptyState } from "../components/progress/WeightEmptyState";
import { api } from "../services/api";

type Range = "all" | "90d" | "30d";

type AnthroState = {
  heightCm: number | null;
};

type Schedule = {
  id: number;
  customer_id: number | null;
  goal?: string | null;
  expire?: string | null;
};

function buildStats(points: WeightPoint[]): WeightStats | null {
  if (!points.length) return null;

  const sorted = [...points].sort(
    (a, b) =>
      new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const diff = last.weight - first.weight;

  let trend: WeightStats["trend"] = "flat";
  if (diff > 0.2) trend = "up";
  if (diff < -0.2) trend = "down";

  return { first, last, diff, trend };
}

export default function ProgressPage() {
  usePageTitle("Progressi");
  const navigate = useNavigate();
  const { data, loading, error, addWeight, updateWeight, deleteWeight } = useWeightHistory();

  const [range, setRange] = useState<Range>("all");
  const [anthro, setAnthro] = useState<AnthroState | null>(null);
  const [goalLabel, setGoalLabel] = useState<string | undefined>();

  // stati per cronologia (edit / delete)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState<string>("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Carico dati profilo (altezza) + obiettivo scheda
  useEffect(() => {
    (async () => {
      try {
        const me: any = await api.get("/me");

        // Altezza può arrivare come number o string: normalizziamo
        const rawHeight =
          me.height ??
          me.customer?.height ??
          me.user?.height ??
          null;

        let heightCm: number | null = null;
        if (rawHeight != null) {
          const parsed =
            typeof rawHeight === "number"
              ? rawHeight
              : parseFloat(String(rawHeight).replace(",", "."));
          if (!Number.isNaN(parsed) && parsed > 0) {
            heightCm = parsed;
          }
        }

        setAnthro({
          heightCm,
        });

        // Obiettivo scheda: prendo la scheda del customer loggato,
        // preferendo quella con data di scadenza più recente / id più alto
        const schedules: Schedule[] = await api.get("/schedules");
        const selfCustomerId: number | null = me.customer?.id ?? null;

        let inferredGoal: string | undefined;
        if (Array.isArray(schedules) && selfCustomerId != null) {
          const mine = schedules.filter(
            (s) => s.customer_id === selfCustomerId
          );
          if (mine.length > 0) {
            mine.sort((a, b) => {
              const da = a.expire ? new Date(a.expire).getTime() : 0;
              const db = b.expire ? new Date(b.expire).getTime() : 0;
              if (da !== db) return db - da;
              return (b.id ?? 0) - (a.id ?? 0);
            });
            inferredGoal = mine[0].goal ?? undefined;
          }
        }

        setGoalLabel(inferredGoal);
      } catch (err) {
        console.error("[ProgressPage] errore caricando dati profilo/schede", err);
      }
    })();
  }, []);

  // cronologia ordinata (più recenti in alto)
  const sortedHistory = useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          new Date(b.measured_at).getTime() -
          new Date(a.measured_at).getTime()
      ),
    [data]
  );

  function startEdit(entry: WeightPoint) {
    setEditingId(entry.id);
    setEditWeight(String(entry.weight));
    setHistoryError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditWeight("");
  }

  async function saveEdit(id: number) {
    const value = Number(editWeight.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setHistoryError("Inserisci un peso valido maggiore di 0.");
      return;
    }

    try {
      setSavingId(id);
      setHistoryError(null);
      await updateWeight(id, value);
      setEditingId(null);
      setEditWeight("");
    } catch (e: any) {
      setHistoryError(
        e?.response?.data?.message ??
          e?.message ??
          "Errore durante l'aggiornamento della misurazione."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Vuoi davvero eliminare questa misurazione?")) return;

    try {
      setDeletingId(id);
      setHistoryError(null);
      await deleteWeight(id);
    } catch (e: any) {
      setHistoryError(
        e?.response?.data?.message ??
          e?.message ??
          "Errore durante l'eliminazione della misurazione."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const stats = useMemo(() => buildStats(data), [data]);

  // Loader
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Caricamento dei tuoi progressi…
        </div>
      </div>
    );
  }

  // Nessun dato: stato vuoto
  if (!loading && !error && data.length === 0) {
    return <WeightEmptyState />;
  }

  const heightCm = anthro?.heightCm ?? null;

  return (
    <div className="min-h-[70vh] w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Errore globale */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200">
            <p className="font-semibold">Si è verificato un errore</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 opacity-80">
              Prova ad aggiornare la pagina. Se il problema persiste, riprova più tardi.
            </p>
          </div>
        )}

        {/* Header pagina */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              I tuoi progressi
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Tieni traccia del tuo peso nel tempo e collegalo alle schede di allenamento.
            </p>
            {heightCm && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Altezza registrata: {heightCm} cm
              </p>
            )}
            {goalLabel && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Obiettivo scheda attuale:{" "}
                <span className="font-semibold">{goalLabel}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => navigate("/schedules")}
            className="mt-3 inline-flex items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700/60 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-900/60 sm:mt-0"
          >
            Vai alle mie schede
          </button>
        </header>

        {/* Riepilogo */}
        {stats && (
          <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <WeightSummary
              stats={stats}
              goalLabel={goalLabel}
              heightCm={heightCm}
            />
          </section>
        )}

        {/* Form inserimento peso */}
        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <WeightEntryForm onSave={addWeight} />
        </section>

        {/* Grafico con filtri + fascia normopeso */}
        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <WeightChart
            data={data}
            range={range}
            onRangeChange={setRange}
            onGoToSchedules={() => navigate("/schedules")}
            heightCm={heightCm}
          />
        </section>

        {/* Cronologia misurazioni */}
        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Cronologia misurazioni
              </h2>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Se commetti un errore nell&apos;inserimento del peso puoi
                modificarlo o eliminarlo da qui.
              </p>
            </div>
          </div>

          {historyError && (
            <p className="mt-3 text-xs text-red-500 dark:text-red-400">
              {historyError}
            </p>
          )}

          {!sortedHistory.length ? (
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Non ci sono ancora misurazioni salvate.
            </p>
          ) : (
            <div className="mt-4 max-h-80 overflow-y-auto">
              <table className="min-w-full text-xs">
                <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="py-2 pr-4 text-left font-medium">Data</th>
                    <th className="py-2 pr-4 text-left font-medium">Peso (kg)</th>
                    <th className="py-2 text-right font-medium">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHistory.map((entry) => {
                    const isEditing = editingId === entry.id;
                    const isSaving = savingId === entry.id;
                    const isDeleting = deletingId === entry.id;

                    const dateLabel = new Date(entry.measured_at).toLocaleString("it-IT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                      >
                        <td className="py-2 pr-4 align-middle text-gray-800 dark:text-gray-100">
                          {dateLabel}
                        </td>
                        <td className="py-2 pr-4 align-middle text-gray-800 dark:text-gray-100">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              className="w-24 rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                              value={editWeight}
                              onChange={(e) => setEditWeight(e.target.value)}
                            />
                          ) : (
                            `${entry.weight.toFixed(1)} kg`
                          )}
                        </td>
                        <td className="py-2 align-middle text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => saveEdit(entry.id)}
                                disabled={isSaving}
                                className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {isSaving ? "Salvataggio..." : "Salva"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={isSaving}
                                className="rounded-md px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                              >
                                Annulla
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => startEdit(entry)}
                                disabled={isDeleting}
                                className="rounded-md px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                              >
                                Modifica
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(entry.id)}
                                disabled={isDeleting}
                                className="rounded-md px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                {isDeleting ? "Eliminazione..." : "Elimina"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
