// client/src/components/progress/WeightEmptyState.tsx
import { useNavigate } from "react-router-dom";

export function WeightEmptyState() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 dark:border-indigo-700/60 dark:bg-indigo-950/40">
          <span className="text-2xl">📉</span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
          Nessuna misurazione del peso ancora
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Inizia a registrare il tuo peso per vedere come cambiano i tuoi progressi nel tempo
          e collegarli alle schede di allenamento.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate("/schedules")}
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Vai alle mie schede
          </button>
          <button
            onClick={() => navigate("/workout")}
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            Crea un nuovo allenamento
          </button>
        </div>
      </div>
    </div>
  );
}
