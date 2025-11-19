// client/src/components/progress/WeightChart.tsx
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import type { WeightPoint } from "../../hooks/useWeightHistory";

type Range = "all" | "90d" | "30d";

type Props = {
  data: WeightPoint[];
  range: Range;
  onRangeChange: (range: Range) => void;
  onGoToSchedules: () => void;
  /**
   * Altezza in cm (es. 175). Se presente,
   * disegniamo la fascia di normopeso (IMC 18.5–24.9).
   */
  heightCm?: number | null;
};

type ChartPoint = {
  date: string;
  weight: number;
};

// Tooltip personalizzato
function WeightTooltip(props: any) {
  const { active, payload, label } = props;

  if (!active || !payload || !payload.length) return null;

  // ✅ Cerca esplicitamente il punto della linea "weight"
  const point =
    payload.find((p: any) => p.dataKey === "weight") ?? payload[0];

  const rawWeight = point?.payload?.weight;
  const weightNumber =
    typeof rawWeight === "number" ? rawWeight : Number(rawWeight);

  const display =
    Number.isFinite(weightNumber) && weightNumber !== 0
      ? `${weightNumber.toFixed(1)} kg`
      : "-";

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-md dark:border-gray-700 dark:bg-gray-900">
      <div className="font-medium text-gray-900 dark:text-gray-100">
        {label}
      </div>
      <div className="mt-1 text-gray-600 dark:text-gray-300">
        Peso: <span className="font-semibold">{display}</span>
      </div>
    </div>
  );
}

export function WeightChart({
  data,
  range,
  onRangeChange,
  onGoToSchedules,
  heightCm,
}: Props) {
  
  const filtered = useMemo(() => {
  const sorted = [...data].sort(
    (a, b) =>
      new Date(a.measured_at).getTime() -
      new Date(b.measured_at).getTime()
  );

  if (range === "all") return sorted;

  const now = Date.now();
  const days = range === "90d" ? 90 : 30;
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  return sorted.filter(
    (p) => new Date(p.measured_at).getTime() >= cutoff
  );
}, [data, range]);


  const chartData: ChartPoint[] = useMemo(
    () =>
      filtered.map((p) => ({
        date: new Date(p.measured_at).toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "2-digit",
        }),
        weight: Number(p.weight),
      })),
    [filtered]
  );

  const heightMeters =
    typeof heightCm === "number" && heightCm > 0 ? heightCm / 100 : null;

  const normalBand = useMemo(() => {
    if (!heightMeters) return null;
    const h2 = heightMeters * heightMeters;
    const min = 18.5 * h2;
    const max = 24.9 * h2;
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return { min, max };
  }, [heightMeters]);

  const yDomain = useMemo<[number, number] | undefined>(() => {
    if (!chartData.length) return undefined;

    const weights = chartData.map((p) => p.weight);
    let min = Math.min(...weights);
    let max = Math.max(...weights);

    if (normalBand) {
      min = Math.min(min, normalBand.min);
      max = Math.max(max, normalBand.max);
    }

    const pad = Math.max(1, (max - min) * 0.1);
    const yMin = Math.floor(min - pad);
    const yMax = Math.ceil(max + pad);

    return [yMin, yMax];
  }, [chartData, normalBand]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Andamento del peso
          </h2>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Osserva come varia il tuo peso nel tempo e confrontalo con l’intervallo
            considerato normopeso per la tua altezza (se disponibile).
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1 text-xs dark:bg-gray-800/80">
          {[
            { value: "all", label: "Tutto" },
            { value: "90d", label: "Ultimi 3 mesi" },
            { value: "30d", label: "Ultimi 30 giorni" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => onRangeChange(item.value as Range)}
              className={`px-3 py-1 rounded-full transition-colors ${
                range === item.value
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                  : "text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-800/60"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Nessuna misurazione disponibile per l&apos;intervallo selezionato.
          <button
            onClick={onGoToSchedules}
            className="ml-2 inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            Vai alle schede di allenamento
          </button>
        </div>
      ) : (
        <>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  width={40}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `${v.toFixed(0)}`}
                  domain={yDomain}
                />

                {/* Tooltip custom che usa sempre il payload */}
                <Tooltip content={<WeightTooltip />} />

                {normalBand && (
                  <ReferenceArea
                    y1={normalBand.min}
                    y2={normalBand.max}
                    strokeOpacity={0}
                    fill="rgba(34,197,94,0.18)"
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="weight"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {normalBand && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Fascia evidenziata: intervallo di peso corrispondente a{" "}
              <span className="font-semibold">IMC 18.5–24.9</span> per la tua
              altezza registrata.
            </p>
          )}
        </>
      )}
    </section>
  );
}
