import { useEffect, useMemo, useState } from "react";
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

  // nuovi campi per mostrare il creatore
  freelancer_id?: number | null;
  creator_first_name?: string | null;
  creator_last_name?: string | null;
  creator?: string | null; // fallback stringa se fornita
};

export default function ScheduleListPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  // ===== Auth snapshot per etichetta "Creatore" =====
  const auth = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("authData") || "{}"); }
    catch { return {}; }
  }, []);
  const me = auth?.user ?? {};
  const myFirst = (me?.first_name ?? me?.firstName ?? "") as string;
  const myLast  = (me?.last_name  ?? me?.lastName  ?? "") as string;
  const myFullNames = [myFirst, myLast].filter(Boolean).join(" ").trim(); // SOLO Nome Cognome

  // helper: data scaduta?
  const isExpired = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const exp = new Date(`${dateStr}T23:59:59`);
    if (Number.isNaN(exp.getTime())) return false;
    return exp.getTime() < Date.now();
  };

  useEffect(() => {
    const authLS = JSON.parse(localStorage.getItem("authData") || "{}");
    const token: string | null = authLS?.token || null;

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
                  className={`rounded-2xl shadow p-6 hover:shadow-lg transition-all bg-white ${
                    expired ? "border border-red-200" : "border border-transparent"
                  }`}
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
          <h1 className="text-2xl font-bold text-indigo-700">Le tue schede nutrizionali</h1>
        </div>

        {nutritionPlans.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {nutritionPlans.map((p) => {
                const expired = isExpired(p.expire);
                const dateLabel = p.expire ? new Date(p.expire).toLocaleDateString() : "—";

                // Richiesta: "nome e cognome del creatore".
                // Se NON c'è freelancer_id => il creatore è l'utente che sta visualizzando.
                const names = [p.creator_first_name ?? "", p.creator_last_name ?? ""]
                  .map((s) => s?.trim())
                  .filter(Boolean)
                  .join(" ")
                  .trim();

                const creatorName = p.freelancer_id
                  ? (names || p.creator || "Professionista")   // se il pro non ha nomi, usa p.creator o fallback
                  : (myFullNames || "Tu");                     // se creato dall'utente, mostra suoi Nome Cognome (no nickname)

                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl shadow p-6 hover:shadow-lg transition-all bg-white ${
                      expired ? "border border-red-200" : "border border-transparent"
                    }`}
                  >
                    <h3 className="text-xl font-semibold text-indigo-700 mb-2 capitalize">
                      {p.goal?.replace("_", " ")}
                    </h3>
                    <p className="text-gray-600 mb-1">
                      Giorni: <strong>{p.days_count ?? "-"}</strong>
                    </p>
                    <p className="text-gray-600 mb-1">
                      Scadenza:{" "}
                      <span className={`font-semibold ${expired ? "!text-red-600" : "text-gray-800"}`}>
                        {dateLabel} {expired ? "(SCADUTA)" : ""}
                      </span>
                    </p>
                    <p className="text-gray-600 mb-4">
                      Creatore: <strong>{creatorName}</strong>
                    </p>
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

            {/* Richiesta: pulsante "Crea" al centro SOTTO le schede */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => navigate("/nutrizione")}
                className="px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Crea una scheda nutrizionale
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-600">Non hai ancora piani nutrizionali.</p>
        )}
      </section>
    </div>
  );
}
