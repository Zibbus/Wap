import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

type Exercise = {
  exercise_id?: number | null;
  musclegroups_id?: number | null;
  name: string;
  sets: number | null;
  reps: number | null;
  rest_seconds: number | null;
  weight_value: number | null;
  notes: string | null;
};

type Day = {
  id: number;
  day: number;
  exercises: Exercise[];
};

type ScheduleDetail = {
  id: number;
  goal: "peso_costante" | "aumento_peso" | "perdita_peso" | "altro";
  expire: string | null;

  creator?: string;

  freelancer_id?: number | null;
  customer_id?: number | null;

  creator_user_id?: number | null;
  creator_first_name?: string | null;
  creator_last_name?: string | null;

  days: Day[];
};

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // ===== Auth snapshot (localStorage) =====
  const auth = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("authData") || "{}"); }
    catch { return {}; }
  }, []);
  const token: string | null = auth?.token ?? null;

  const me = auth?.user ?? {};
  const myUserId: number | null = me?.id ?? auth?.userId ?? null;
  const myUsername: string | null = me?.username ?? auth?.username ?? null;
  const myFirst = (me?.first_name ?? me?.firstName ?? "") as string;
  const myLast  = (me?.last_name  ?? me?.lastName  ?? "") as string;
  const myFull  = [myFirst, myLast].filter(Boolean).join(" ").trim();
  const myRole  = (me?.type ?? auth?.role ?? null) as "utente" | "professionista" | "admin" | null;

  const myCustomerId: number | null =
    (me?.customer?.id ?? auth?.customer_id ?? null) as number | null;

  const myFreelancerId: number | null =
    (me?.freelancer_id ?? me?.freelancer?.id ?? me?.professional?.id ?? null) as number | null;

  // ===== helper scadenza =====
  function isExpiredDate(isoDate?: string | null): boolean {
    if (!isoDate) return false;
    const endOfDay = new Date(`${isoDate}T23:59:59`);
    const now = new Date();
    return endOfDay.getTime() < now.getTime();
  }

  // ===== Carica dettaglio =====
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/schedules/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setSchedule(data);
      } catch (e: any) {
        setError(e?.message || "Errore caricamento dettagli");
      }
    })();
  }, [id, token]);

  // ===== Etichetta creatore =====
  const creatorLabel = useMemo(() => {
    if (!schedule) return "—";
    const apiFull = [schedule.creator_first_name, schedule.creator_last_name]
      .filter(Boolean).join(" ").trim();

    if (schedule.freelancer_id) {
      const imCreator = myFreelancerId != null && Number(myFreelancerId) === Number(schedule.freelancer_id);
      return (imCreator ? (myFull || myUsername) : (apiFull || schedule.creator)) || "Professionista";
    } else {
      const imCreator = myCustomerId != null && schedule.customer_id != null &&
        Number(myCustomerId) === Number(schedule.customer_id);
      return (imCreator ? (myFull || myUsername) : (apiFull || schedule.creator)) || "Cliente";
    }
  }, [schedule, myFreelancerId, myCustomerId, myFull, myUsername]);

  // ===== Permessi modifica =====
  const canEdit = useMemo(() => {
    if (!schedule) return false;
    const isPro = myRole === "professionista" || myRole === "admin";

    const createdByPro =
      !!schedule.freelancer_id &&
      myFreelancerId != null &&
      Number(myFreelancerId) === Number(schedule.freelancer_id);

    const createdByCustomer =
      !schedule.freelancer_id &&
      myCustomerId != null &&
      schedule.customer_id != null &&
      Number(myCustomerId) === Number(schedule.customer_id);

    const sameByText =
      !!schedule.creator && (schedule.creator === myFull || schedule.creator === myUsername);

    const sameById =
      schedule.creator_user_id != null &&
      myUserId != null &&
      Number(schedule.creator_user_id) === Number(myUserId);

    return isPro || createdByPro || createdByCustomer || sameByText || sameById;
  }, [schedule, myRole, myFreelancerId, myCustomerId, myFull, myUsername, myUserId]);

  // ===== UI =====
  if (error) {
    return (
      <div className="min-h-screen bg-white px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="mb-6 text-indigo-600 hover:underline">
            ← Torna indietro
          </button>
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!schedule)
    return <p className="text-center mt-20 text-gray-600">Caricamento...</p>;

  const expired = isExpiredDate(schedule.expire);
  const expireLabel = schedule.expire ? new Date(schedule.expire).toLocaleDateString() : "—";

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:underline"
          >
            ← Torna indietro
          </button>

          {canEdit && (
            <button
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => navigate("/workout", { state: { editSchedule: schedule } })}
              title="Modifica questa scheda"
            >
              Modifica scheda
            </button>
          )}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700 mb-2">
              Scheda #{schedule.id} – {schedule.goal.replace("_", " ")}
            </h1>
            <p className="text-gray-600">
              Scadenza:{" "}
              <span className={`font-semibold ${expired ? "!text-red-600" : "text-gray-800"}`}>
                {expireLabel}
              </span>
              {expired && (
                <span className="ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] bg-red-100 text-red-700">
                  Scaduta
                </span>
              )}
              {" "}· Creatore: <strong>{creatorLabel}</strong>
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {schedule.days.map((day) => (
            <div
              key={day.id}
              className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/40"
            >
              <h3 className="font-bold text-indigo-600 mb-2">
                Giorno {day.day}
              </h3>
              {day.exercises.length > 0 ? (
                day.exercises.map((ex, i) => (
                  <div key={i} className="text-sm mb-2 bg-white rounded p-2">
                    <span className="font-medium">{ex.name}</span> · Serie:{" "}
                    {ex.sets ?? "-"} · Rip: {ex.reps ?? "-"} · Rec:{" "}
                    {ex.rest_seconds ?? "-"}s{" "}
                    {ex.weight_value != null && <>· Peso: {ex.weight_value}kg</>}
                    {ex.notes && (
                      <p className="text-xs text-gray-600 italic mt-1">
                        💬 {ex.notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nessun esercizio</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
