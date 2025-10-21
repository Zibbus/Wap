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

export default function ScheduleListPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // ⚠️ Cambia con il tuo endpoint backend
    fetch("http://localhost:4000/api/schedules?customer_id=1")
      .then((res) => res.json())
      .then(setSchedules)
      .catch((err) => console.error("Errore caricamento schede:", err));
  }, []);

  return (
    <div className="min-h-screen bg-indigo-50 px-8 py-10">
      <h1 className="text-3xl font-bold text-indigo-700 mb-8 text-center">
        Le tue schede di allenamento
      </h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {schedules.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition-all"
          >
            <h2 className="text-xl font-semibold text-indigo-700 mb-2 capitalize">
              {s.goal.replace("_", " ")}
            </h2>
            <p className="text-gray-600 mb-1">
              Giorni di allenamento: <strong>{s.days_count}</strong>
            </p>
            <p className="text-gray-600 mb-1">
              Scadenza: <strong>{new Date(s.expire).toLocaleDateString()}</strong>
            </p>
            <p className="text-gray-600 mb-4">
              Creatore: <strong>{s.creator}</strong>
            </p>

            <button
              onClick={() => navigate(`/schedules/${s.id}`)}
              className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Visualizza scheda
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
