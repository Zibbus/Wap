import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

// Tipi: scheda allenamento (lista)
type Schedule = {
  id: number;
  customer_id: number;
  freelancer_id?: number | null;
  goal: string;
  expire: string;
  creator: string;
  days_count: number;
};

// Tipi: piano nutrizionale (lista)
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

// Pagina: lista schede (allenamento + nutrizione) del cliente
export default function ScheduleListPage() {
  // Stato: liste e messaggi di errore
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  // Leggo authData dal localStorage
  const auth = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("authData") || "{}");
    } catch {
      return {};
    }
  }, []);

  // me è l'utente loggato così come torna dal backend di login
  const me = (auth as any)?.user ?? ({} as any);
  const userType = me?.type as "utente" | "professionista" | "admin" | undefined;

  // Nome e cognome (per scritta "Creatore: Tu")
  const myFirst = (me?.firstName ?? me?.first_name ?? "") as string;
  const myLast = (me?.lastName ?? me?.last_name ?? "") as string;
  const myFullNames = [myFirst, myLast].filter(Boolean).join(" ").trim(); // SOLO Nome Cognome

  // ID collegati al DB (customers / freelancers)
  // Dal login.ts sappiamo che:
  //  user.customer   -> { id: customers.id } | null
  //  user.freelancer -> { id: freelancers.id } | null
  const customerId: number | null =
    me?.customer && typeof me.customer.id === "number"
      ? me.customer.id
      : null;

  const freelancerId: number | null =
    me?.freelancer && typeof me.freelancer.id === "number"
      ? me.freelancer.id
      : null;

  // Helper: verifica se una data è scaduta (fine giornata)
  const isExpired = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const exp = new Date(`${dateStr}T23:59:59`);
    if (Number.isNaN(exp.getTime())) return false;
    return exp.getTime() < Date.now();
  };

  // Effetto: carica liste da API (allenamento + nutrizione)
  useEffect(() => {
    // Schede allenamento
    (async () => {
      try {
        const data = await api.get<Schedule[]>("/schedules");
        const list = Array.isArray(data) ? data : [];

        // 🔎 filtro lato FE in base al tipo utente e agli ID DB
        let filtered = list;

        if (userType === "utente" && customerId) {
          // utente normale -> vede le schede dove schedules.customer_id = suo customers.id
          filtered = list.filter((s) => s.customer_id === customerId);
        } else if (userType === "professionista" && freelancerId) {
          // professionista -> vede le schede dove schedules.freelancer_id = suo freelancers.id
          filtered = list.filter(
            (s) => s.freelancer_id != null && s.freelancer_id === freelancerId
          );
        }

        setSchedules(filtered);
      } catch (e: any) {
        if (String(e?.message || "").includes("401")) {
          setErrorMsg("Sessione scaduta o non autenticato.");
        }
        setSchedules([]);
      }
    })();

    // Piani nutrizionali
    (async () => {
      try {
        const data = await api.get<NutritionPlan[]>("/nutrition/plans");
        const list = Array.isArray(data) ? data : [];

        let filtered = list;

        if (userType === "utente" && customerId) {
          filtered = list.filter((p) => p.customer_id === customerId);
        } else if (userType === "professionista" && freelancerId) {
          filtered = list.filter(
            (p) => p.freelancer_id != null && p.freelancer_id === freelancerId
          );
        }

        setNutritionPlans(filtered);
      } catch {
        setNutritionPlans([]);
      }
    })();
  }, [userType, customerId, freelancerId]);

  // UI: contenitore principale + avvisi
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

      {/* Sezione: Allenamento */}
      <section className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">
            Le tue schede di allenamento
          </h1>
        </div>

        {schedules.length === 0 ? (
          <p className="text-gray-600 mb-6">
            Non ci sono schede di allenamento.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {schedules.map((s) => {
              const expired = isExpired(s.expire);
              const dateLabel = s.expire
                ? new Date(s.expire).toLocaleDateString()
                : "—";
              return (
                <div
                  key={s.id}
                  className={`rounded-2xl shadow p-6 hover:shadow-lg transition-all bg-white ${
                    expired
                      ? "border border-red-200"
                      : "border border-transparent"
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

        {/* CTA: crea nuova scheda allenamento */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate("/Workout")}
            className="px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Crea una scheda di allenamento
          </button>
        </div>
      </section>

      {/* Sezione: Nutrizione */}
      <section className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-indigo-700">
            Le tue schede nutrizionali
          </h1>
        </div>

        {nutritionPlans.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {nutritionPlans.map((p) => {
                const expired = isExpired(p.expire);
                const dateLabel = p.expire
                  ? new Date(p.expire).toLocaleDateString()
                  : "—";

                // Calcolo etichetta creatore (Pro → nome/cognome se presenti; Cliente → i tuoi Nome/Cognome)
                const names = [p.creator_first_name ?? "", p.creator_last_name ?? ""]
                  .map((s) => s?.trim())
                  .filter(Boolean)
                  .join(" ")
                  .trim();

                const creatorName = p.freelancer_id
                  ? names || p.creator || "Professionista"
                  : myFullNames || "Tu";

                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl shadow p-6 hover:shadow-lg transition-all bg-white ${
                      expired
                        ? "border border-red-200"
                        : "border border-transparent"
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
                      <span
                        className={`font-semibold ${
                          expired ? "!text-red-600" : "text-gray-800"
                        }`}
                      >
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

            {/* CTA: crea nuovo piano nutrizionale */}
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
