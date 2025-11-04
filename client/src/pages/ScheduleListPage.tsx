// client/src/pages/ScheduleListPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Schedule = {
  id: number;
  customer_id: number;
  goal: string;
  expire: string;
  creator: string;
  days_count: number;
};

type NutritionPlan = {
  id: number;
  customer_id: number;
  goal: string;
  expire: string;
  days_count?: number;
  creator?: string;
};

export default function ScheduleListPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  // helper: data scaduta?
  const isExpired = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const exp = new Date(`${dateStr}T23:59:59`); // considera tutto il giorno di scadenza
    if (Number.isNaN(exp.getTime())) return false;
    return exp.getTime() < Date.now();
  };

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem("authData") || "{}");
    const token: string | null = auth?.token || null;

    const commonHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    // Schede allenamento
    (async () => {
      try {
        const res = await fetch("http://localhost:4000/api/schedules", {
          headers: {
            Accept: "application/json",
            ...commonHeaders,
          },
        });

        if (res.status === 401) {
          setErrorMsg("Sessione scaduta o non autenticato.");
          setSchedules([]);
          return;
        }

        const data = await res.json().catch(() => []);
        setSchedules(Array.isArray(data) ? (data as Schedule[]) : []);
      } catch (e) {
        console.error("Errore caricamento schede (allenamento):", e);
        setSchedules([]);
      }
    })();

    // Piani nutrizionali
    (async () => {
      try {
        const res = await fetch("http://localhost:4000/api/nutrition/plans", {
          headers: {
            Accept: "application/json",
            ...commonHeaders,
          },
        });
        if (res.status === 401) {
          setNutritionPlans([]);
          return;
        }
        const data = await res.json().catch(() => []);
        setNutritionPlans(Array.isArray(data) ? (data as NutritionPlan[]) : []);
      } catch {
        setNutritionPlans([]);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-indigo-50 px-8 py-10 space-y-12">
      {/* errore auth */}
      {errorMsg && (
        <div className="max-w-5xl mx-auto bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {errorMsg}{" "}
          <button className="underline ml-2" onClick={() => navigate("/login")}>
            Accedi
          </button>
        </div>
      )}

      {/* ===== Sezione Allenamento ===== */}
      <section className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">Le tue schede di allenamento</h1>
        </div>

        {schedules.length === 0 ? (
          <p className="text-gray-600 mb-6">Non ci sono schede di allenamento.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {schedules.map((s) => {
              const expired = isExpired(s.expire);
              const dateLabel = s.expire ? new Date(s.expire).toLocaleDateString() : "—";
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition-all"
                >
                  <h2 className="text-xl font-semibold text-indigo-700 mb-2 capitalize">
                    {s.goal?.replace("_", " ")}
                  </h2>
                  <p className="text-gray-600 mb-1">
                    Giorni di allenamento: <strong>{s.days_count}</strong>
                  </p>
                  <p className="text-gray-600 mb-1">
                    Scadenza:{" "}
                    <strong className={expired ? "text-red-600" : ""}>
                      {dateLabel} {expired ? "(SCADUTA)" : ""}
                    </strong>
                  </p>
                  <p className="text-gray-600 mb-4">
                    Creatore: <strong>{s.creator || "—"}</strong>
                  </p>

                  <button
                    onClick={() => navigate(`/schedules/${s.id}`)}
                    className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Visualizza scheda
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* bottone nutrizione in coda alla sezione allenamento */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate("/Workout")}
            className="px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Crea una scheda di allenamento
          </button>
        </div>
      </section>

      {/* ===== Sezione Nutrizione ===== */}
      <section className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-indigo-700">Le tue schede nutrizionali</h2>
        </div>

        <div className="mb-6">
          <button
            onClick={() => navigate("/nutrizione")}
            className="px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Crea una scheda nutrizionale
          </button>
        </div>

        {nutritionPlans.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {nutritionPlans.map((p) => {
              const expired = isExpired(p.expire);
              const dateLabel = p.expire ? new Date(p.expire).toLocaleDateString() : "—";
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition-all"
                >
                  <h3 className="text-xl font-semibold text-indigo-700 mb-2 capitalize">
                    {p.goal?.replace("_", " ")}
                  </h3>
                  <p className="text-gray-600 mb-1">
                    Giorni: <strong>{p.days_count ?? "-"}</strong>
                  </p>
                  <p className="text-gray-600 mb-1">
                    Scadenza:{" "}
                    <strong className={expired ? "text-red-600" : ""}>
                      {dateLabel} {expired ? "(SCADUTA)" : ""}
                    </strong>
                  </p>
                  {p.creator && (
                    <p className="text-gray-600 mb-4">
                      Creatore: <strong>{p.creator}</strong>
                    </p>
                  )}
                  <button
                    onClick={() => navigate(`/nutrition/plans/${p.id}`)}
                    className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Visualizza piano
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600">Non hai ancora piani nutrizionali.</p>
        )}
      </section>
    </div>
  );
}
