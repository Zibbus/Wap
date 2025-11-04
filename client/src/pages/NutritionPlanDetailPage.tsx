import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

type Item = {
  id: number;
  position: number;
  label: string;
  qty: number | null;
  unit: string | null;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

type Meal = {
  id: number;
  position: number;
  name: string;
  notes: string | null;
  items: Item[];
};

type Day = {
  id: number;
  day: number;
  meals: Meal[];
};

type PlanDetail = {
  id: number;
  goal: string;
  expire: string;
  creator: string;
  days: Day[];
};

export default function NutritionPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem("authData") || "{}");
    const token: string | null = auth?.token || null;

    fetch(`http://localhost:4000/api/nutrition/plans/${id}`, {
      headers: {
        "Accept": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then(setPlan)
      .catch((err) => console.error("Errore caricamento piano:", err));
  }, [id]);

  if (!plan) return <p className="text-center mt-20 text-gray-600">Caricamento…</p>;

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 text-indigo-600 hover:underline">
          ← Torna indietro
        </button>

        <h1 className="text-3xl font-bold text-indigo-700 mb-2">
          Piano nutrizionale #{plan.id} – {plan.goal?.replace("_", " ")}
        </h1>
        <p className="text-gray-600 mb-8">
          Scadenza: <strong>{plan.expire ? new Date(plan.expire).toLocaleDateString() : "—"}</strong> ·
          Creatore: <strong>{plan.creator || "—"}</strong>
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {plan.days.map((d) => (
            <div key={d.id} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/40">
              <h3 className="font-bold text-indigo-600 mb-2">Giorno {d.day}</h3>

              {d.meals.length ? d.meals.map((m) => (
                <div key={m.id} className="mb-4 bg-white rounded p-3 border border-gray-100">
                  <div className="font-semibold">{m.name}</div>
                  {m.notes && <div className="text-xs text-gray-600 italic mt-0.5">💬 {m.notes}</div>}

                  <div className="mt-2 space-y-1">
                    {m.items.length ? m.items.map((it) => (
                      <div key={it.id} className="text-sm text-gray-800">
                        • {it.label} {it.qty != null ? `– ${it.qty}${it.unit || ""}` : ""}
                        {it.kcal != null && <> · {it.kcal} kcal</>}
                        {it.protein_g != null && <> · P {it.protein_g}g</>}
                        {it.carbs_g != null && <> · C {it.carbs_g}g</>}
                        {it.fat_g != null && <> · F {it.fat_g}g</>}
                      </div>
                    )) : <div className="text-sm text-gray-500">Nessun alimento</div>}
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500">Nessun pasto</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
