import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

type Exercise = {
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
  goal: string;
  expire: string;
  creator: string;
  days: Day[];
};

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:4000/api/schedules/${id}`)
      .then((res) => res.json())
      .then(setSchedule)
      .catch((err) => console.error("Errore caricamento dettagli:", err));
  }, [id]);

  if (!schedule)
    return <p className="text-center mt-20 text-gray-600">Caricamento...</p>;

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-indigo-600 hover:underline"
        >
          ← Torna indietro
        </button>

        <h1 className="text-3xl font-bold text-indigo-700 mb-4">
          Scheda #{schedule.id} – {schedule.goal.replace("_", " ")}
        </h1>
        <p className="text-gray-600 mb-6">
          Scadenza:{" "}
          <strong>{new Date(schedule.expire).toLocaleDateString()}</strong> ·
          Creatore: <strong>{schedule.creator}</strong>
        </p>

        <div className="grid md:grid-cols-2 gap-6">
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
                    {ex.weight_value && <>· Peso: {ex.weight_value}kg</>}
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
