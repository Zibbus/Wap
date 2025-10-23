import { useEffect, useMemo, useState } from "react";

type Goal =
  | "mantenimento"
  | "aumento_peso"
  | "perdita_peso"
  | "definizione"
  | "massa"
  | "peso_costante"
  | "altro";

type OwnerMode = "self" | "other";

type UserAnthro = {
  first_name?: string;
  last_name?: string;
  sex?: "M" | "F" | "O";
  dob?: string; // YYYY-MM-DD
  weight?: number | null; // kg
  height?: number | null; // cm
};

type FoodRow = {
  id?: number;           // foods.id (opzionale)
  description?: string;  // testo libero se non si usa foods.id
  qty: number;           // quantità
  unit: "g" | "ml" | "pcs" | "cup" | "tbsp" | "tsp" | "slice";
  kcal?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
};

type Meal = {
  id?: number;
  position: number;
  name: string; // Colazione/Spuntino/Pranzo/Cena/...
  notes?: string;
  items: FoodRow[];
};

type NutritionDay = {
  day: number; // 1..7
  meals: Meal[];
};

type PlanState = {
  ownerMode: OwnerMode;
  // intestatario
  selfCustomerId?: number | null; // se self, lo ricaviamo dal backend
  otherPerson: {
    first_name: string;
    last_name: string;
    sex: "M" | "F" | "O";
    age: number | ""; // anni (solo visual, non salvo)
    weight: number | ""; // kg
    height: number | ""; // cm
  };
  warningAccepted: boolean;

  expire: string; // YYYY-MM-DD
  goal: Goal;
  activity: "sedentario" | "leggero" | "moderato" | "intenso" | "atleta";
  notes: string;

  days: NutritionDay[]; // 1..7
};

// ---------- helpers ----------
const activityFactor: Record<PlanState["activity"], number> = {
  sedentario: 1.2,
  leggero: 1.375,
  moderato: 1.55,
  intenso: 1.725,
  atleta: 1.9,
};

function ageFromDOB(dob?: string): number | undefined {
  if (!dob) return undefined;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

/** Mifflin–St Jeor */
function bmr(sex: "M" | "F" | "O" | undefined, weightKg?: number, heightCm?: number, ageYears?: number) {
  if (!weightKg || !heightCm || !ageYears) return undefined;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (sex === "M") return base + 5;
  if (sex === "F") return base - 161;
  return base; // neutro
}

function kcalForGoal(goal: Goal, tdee: number | undefined) {
  if (!tdee) return undefined;
  switch (goal) {
    case "perdita_peso":
    case "definizione":
      return Math.round(tdee * 0.8); // -20%
    case "aumento_peso":
    case "massa":
      return Math.round(tdee * 1.15); // +15%
    case "peso_costante":
    case "mantenimento":
      return Math.round(tdee);
    default:
      return Math.round(tdee);
  }
}

function defaultWeek(): NutritionDay[] {
  const defaultMeals = [
    { position: 1, name: "Colazione", items: [] as FoodRow[] },
    { position: 2, name: "Spuntino", items: [] as FoodRow[] },
    { position: 3, name: "Pranzo", items: [] as FoodRow[] },
    { position: 4, name: "Spuntino 2", items: [] as FoodRow[] },
    { position: 5, name: "Cena", items: [] as FoodRow[] },
  ];
  return Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    meals: JSON.parse(JSON.stringify(defaultMeals)),
  }));
}

export default function NutritionBuilder() {
  const [loadingSelf, setLoadingSelf] = useState(false);
  const [selfData, setSelfData] = useState<UserAnthro>({});
  const [state, setState] = useState<PlanState>({
    ownerMode: "self",
    selfCustomerId: undefined,
    otherPerson: {
      first_name: "",
      last_name: "",
      sex: "O",
      age: "",
      weight: "",
      height: "",
    },
    warningAccepted: false,
    expire: "",
    goal: "mantenimento",
    activity: "moderato",
    notes: "",
    days: defaultWeek(),
  });

  // carica dati utente (self)
  useEffect(() => {
    if (state.ownerMode !== "self") return;
    (async () => {
      try {
        setLoadingSelf(true);
        // Endpoint di comodo: restituisce customer_id + antropometrici utente loggato
        // Atteso: { customer_id, first_name, last_name, sex, dob, weight, height }
        const auth = JSON.parse(localStorage.getItem("authData") || "{}");
        const token = auth?.token;
        const res = await fetch("http://localhost:4000/api/me/anthro", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setSelfData({
            first_name: data.first_name,
            last_name: data.last_name,
            sex: data.sex,
            dob: data.dob,
            weight: data.weight,
            height: data.height,
          });
          setState((s) => ({ ...s, selfCustomerId: data.customer_id ?? null }));
        }
      } catch (e) {
        console.error("Errore load self anthro", e);
      } finally {
        setLoadingSelf(false);
      }
    })();
  }, [state.ownerMode]);

  // calcolo fabbisogno
  const derived = useMemo(() => {
    const sex = state.ownerMode === "self" ? selfData.sex : state.otherPerson.sex;
    const weight =
      state.ownerMode === "self" ? selfData.weight ?? undefined : (state.otherPerson.weight as number | undefined);
    const height =
      state.ownerMode === "self" ? selfData.height ?? undefined : (state.otherPerson.height as number | undefined);
    const age =
      state.ownerMode === "self"
        ? ageFromDOB(selfData.dob)
        : (state.otherPerson.age as number | undefined);

    const BMR = bmr(sex, weight, height, age);
    const TDEE = BMR ? BMR * activityFactor[state.activity] : undefined;
    const target = kcalForGoal(state.goal, TDEE);
    return { BMR: BMR ? Math.round(BMR) : undefined, TDEE: TDEE ? Math.round(TDEE) : undefined, targetKcal: target };
  }, [state.ownerMode, selfData, state.otherPerson, state.activity, state.goal]);

  // handlers rapidi
  const setOther = <K extends keyof PlanState["otherPerson"]>(k: K, v: PlanState["otherPerson"][K]) =>
    setState((s) => ({ ...s, otherPerson: { ...s.otherPerson, [k]: v } }));

  const updateItem = (dIdx: number, mIdx: number, iIdx: number, patch: Partial<FoodRow>) =>
    setState((s) => {
      const next = structuredClone(s);
      Object.assign(next.days[dIdx].meals[mIdx].items[iIdx], patch);
      return next;
    });

  const addItem = (dIdx: number, mIdx: number) =>
    setState((s) => {
      const next = structuredClone(s);
      next.days[dIdx].meals[mIdx].items.push({
        qty: 100,
        unit: "g",
        description: "",
      });
      return next;
    });

  const removeItem = (dIdx: number, mIdx: number, iIdx: number) =>
    setState((s) => {
      const next = structuredClone(s);
      next.days[dIdx].meals[mIdx].items.splice(iIdx, 1);
      return next;
    });

  const setMealName = (dIdx: number, mIdx: number, name: string) =>
    setState((s) => {
      const next = structuredClone(s);
      next.days[dIdx].meals[mIdx].name = name;
      return next;
    });

  // salvataggio (solo se ownerMode === "self")
  const handleSave = async () => {
    if (state.ownerMode !== "self") {
      alert("Questo piano è intestato a un altro soggetto: non verrà salvato nel tuo DB.");
      return;
    }
    if (!state.selfCustomerId) {
      alert("Profilo cliente non trovato.");
      return;
    }
    if (!state.expire) {
      alert("Inserisci la data di scadenza del piano.");
      return;
    }
    try {
      const auth = JSON.parse(localStorage.getItem("authData") || "{}");
      const token = auth?.token;

      // 1) crea nutrition_plan
      const planRes = await fetch("http://localhost:4000/api/nutrition/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          expire: state.expire,
          goal: state.goal,
          notes: state.notes || null,
        }),
      });
      if (!planRes.ok) throw new Error("Errore creazione piano");
      const plan = await planRes.json();
      const planId = plan.id;

      // 2) crea 1..7 days
      const dayIdMap: number[] = [];
      for (const d of state.days) {
        const dRes = await fetch("http://localhost:4000/api/nutrition/days", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ plan_id: planId, day: d.day }),
        });
        if (!dRes.ok) throw new Error("Errore creazione giorno");
        const dj = await dRes.json();
        dayIdMap[d.day] = dj.id;
      }

      // 3) crea meals
      const mealIdMap: Record<string, number> = {};
      for (const d of state.days) {
        const day_id = dayIdMap[d.day];
        for (const meal of d.meals) {
          const mRes = await fetch("http://localhost:4000/api/nutrition/meals", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              day_id,
              position: meal.position,
              name: meal.name,
              notes: meal.notes || null,
            }),
          });
          if (!mRes.ok) throw new Error("Errore creazione pasto");
          const mj = await mRes.json();
          mealIdMap[`${d.day}-${meal.position}`] = mj.id;
        }
      }

      // 4) crea items in blocco
      const itemsPayload = state.days.flatMap((d) =>
        d.meals.flatMap((meal) =>
          meal.items.map((it, idx) => ({
            meal_id: mealIdMap[`${d.day}-${meal.position}`],
            position: idx + 1,
            food_id: it.id ?? null,
            description: it.description || null,
            qty: it.qty ?? null,
            unit: it.unit,
            kcal: it.kcal ?? null,
            protein_g: it.protein_g ?? null,
            carbs_g: it.carbs_g ?? null,
            fat_g: it.fat_g ?? null,
          }))
        )
      );

      if (itemsPayload.length) {
        const iRes = await fetch("http://localhost:4000/api/nutrition/items/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ items: itemsPayload }),
        });
        if (!iRes.ok) throw new Error("Errore salvataggio alimenti");
      }

      alert("✅ Piano nutrizionale salvato!");
    } catch (e) {
      console.error(e);
      alert("❌ Errore salvataggio piano.");
    }
  };

  // PDF LaTeX
  const handleDownloadPDF = async () => {
    try {
      const creator =
        state.ownerMode === "self"
          ? `${selfData.first_name ?? ""} ${selfData.last_name ?? ""}`.trim() || "Utente"
          : `${state.otherPerson.first_name} ${state.otherPerson.last_name}`.trim() || "Altro soggetto";

      const payload = {
        creator,
        logoPath: "", // opzionale, come per le schede allenamento
        plan: {
          expire: state.expire || null,
          goal: state.goal,
          notes: state.notes || null,
          days: state.days.map((d) => ({
            number: d.day,
            meals: d.meals.map((m) => ({
              position: m.position,
              name: m.name,
              notes: m.notes ?? null,
              items: m.items.map((it) => ({
                name: it.description || "", // oppure risolvi foods.id lato backend
                qty: it.qty,
                unit: it.unit,
                kcal: it.kcal ?? null,
                protein_g: it.protein_g ?? null,
                carbs_g: it.carbs_g ?? null,
                fat_g: it.fat_g ?? null,
              })),
            })),
          })),
        },
        totals: {
          bmr: derived.BMR ?? null,
          tdee: derived.TDEE ?? null,
          target_kcal: derived.targetKcal ?? null,
          activity: state.activity,
        },
      };

      const res = await fetch("http://localhost:4000/api/pdf/nutrition-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Errore generazione PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "piano-nutrizionale.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Errore generazione PDF.");
    }
  };

  // ---------- UI ----------
  const disabledSave = state.ownerMode !== "self";

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* intestazione/owner */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">Crea piano nutrizionale</h2>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex items-center gap-3">
            <label className="font-semibold text-indigo-700">Intestatario:</label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={state.ownerMode === "self"}
                onChange={() => setState((s) => ({ ...s, ownerMode: "self" }))}
              />
              <span>Me stesso</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={state.ownerMode === "other"}
                onChange={() => setState((s) => ({ ...s, ownerMode: "other" }))}
              />
              <span>Un’altra persona</span>
            </label>
          </div>

          <div className="ml-auto flex gap-4">
            <div>
              <label className="block text-sm text-indigo-700 mb-1">Scadenza</label>
              <input
                type="date"
                className="p-2 rounded-md border border-indigo-200 bg-white"
                value={state.expire}
                onChange={(e) => setState((s) => ({ ...s, expire: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-indigo-700 mb-1">Obiettivo</label>
              <select
                className="p-2 rounded-md border border-indigo-200 bg-white"
                value={state.goal}
                onChange={(e) => setState((s) => ({ ...s, goal: e.target.value as Goal }))}
              >
                <option value="mantenimento">Mantenimento</option>
                <option value="perdita_peso">Perdita peso</option>
                <option value="definizione">Definizione</option>
                <option value="aumento_peso">Aumento peso</option>
                <option value="massa">Massa</option>
                <option value="peso_costante">Peso costante</option>
                <option value="altro">Altro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-indigo-700 mb-1">Attività</label>
              <select
                className="p-2 rounded-md border border-indigo-200 bg-white"
                value={state.activity}
                onChange={(e) => setState((s) => ({ ...s, activity: e.target.value as PlanState["activity"] }))}
              >
                <option value="sedentario">Sedentario</option>
                <option value="leggero">Leggero</option>
                <option value="moderato">Moderato</option>
                <option value="intenso">Intenso</option>
                <option value="atleta">Atleta</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dati intestatario */}
        {state.ownerMode === "self" ? (
          <div className="mt-4 text-sm text-gray-600">
            {loadingSelf ? (
              <span>Caricamento profilo…</span>
            ) : (
              <div className="flex gap-6 flex-wrap">
                <div>Nome: <strong>{selfData.first_name ?? "-"}</strong></div>
                <div>Cognome: <strong>{selfData.last_name ?? "-"}</strong></div>
                <div>Sesso: <strong>{selfData.sex ?? "-"}</strong></div>
                <div>Età: <strong>{ageFromDOB(selfData.dob) ?? "-"}</strong></div>
                <div>Peso: <strong>{selfData.weight ?? "-"} kg</strong></div>
                <div>Altezza: <strong>{selfData.height ?? "-"} cm</strong></div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-indigo-700">Nome</label>
              <input className="w-full p-2 border rounded" value={state.otherPerson.first_name}
                     onChange={(e) => setOther("first_name", e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-indigo-700">Cognome</label>
              <input className="w-full p-2 border rounded" value={state.otherPerson.last_name}
                     onChange={(e) => setOther("last_name", e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-indigo-700">Sesso</label>
              <select className="w-full p-2 border rounded" value={state.otherPerson.sex}
                      onChange={(e) => setOther("sex", e.target.value as any)}>
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="O">O</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-indigo-700">Età</label>
              <input type="number" className="w-full p-2 border rounded" value={state.otherPerson.age}
                     onChange={(e) => setOther("age", e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm text-indigo-700">Peso (kg)</label>
              <input type="number" className="w-full p-2 border rounded" value={state.otherPerson.weight}
                     onChange={(e) => setOther("weight", e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm text-indigo-700">Altezza (cm)</label>
              <input type="number" className="w-full p-2 border rounded" value={state.otherPerson.height}
                     onChange={(e) => setOther("height", e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
          </div>
        )}

        {/* riepilogo fabbisogno */}
        <div className="mt-5 p-4 bg-indigo-50/60 rounded border border-indigo-100 text-sm">
          <div className="flex flex-wrap gap-6">
            <div>BMR: <strong>{derived.BMR ?? "-"}</strong> kcal</div>
            <div>TDEE: <strong>{derived.TDEE ?? "-"}</strong> kcal</div>
            <div>Target: <strong>{derived.targetKcal ?? "-"}</strong> kcal/die</div>
          </div>
        </div>
      </div>

      {/* contenitore opacizzabile + warning */}
      <div className={`relative ${!state.warningAccepted ? "pointer-events-none opacity-40" : ""}`}>
        {/* editor settimana */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-bold text-indigo-700 mb-4">Settimana (1..7)</h3>

          <div className="grid md:grid-cols-2 gap-6">
            {state.days.map((d, dIdx) => (
              <div key={d.day} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/40">
                <h4 className="font-semibold text-indigo-700 mb-2">Giorno {d.day}</h4>

                {d.meals.map((m, mIdx) => (
                  <div key={m.position} className="mb-4 bg-white rounded p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        className="font-medium flex-1 border rounded p-2"
                        value={m.name}
                        onChange={(e) => setMealName(dIdx, mIdx, e.target.value)}
                      />
                      <span className="text-xs text-gray-500">pos: {m.position}</span>
                    </div>

                    {/* items */}
                    {m.items.map((it, iIdx) => (
                      <div key={iIdx} className="grid grid-cols-12 gap-2 mb-2">
                        <input
                          className="col-span-4 border rounded p-2"
                          placeholder="Alimento o descrizione"
                          value={it.description || ""}
                          onChange={(e) => updateItem(dIdx, mIdx, iIdx, { description: e.target.value })}
                        />
                        <input
                          type="number"
                          className="col-span-2 border rounded p-2"
                          value={it.qty}
                          min={0}
                          onChange={(e) => updateItem(dIdx, mIdx, iIdx, { qty: Number(e.target.value) })}
                        />
                        <select
                          className="col-span-2 border rounded p-2"
                          value={it.unit}
                          onChange={(e) => updateItem(dIdx, mIdx, iIdx, { unit: e.target.value as any })}
                        >
                          <option>g</option><option>ml</option><option>pcs</option>
                          <option>cup</option><option>tbsp</option><option>tsp</option><option>slice</option>
                        </select>
                        <input
                          type="number" className="col-span-1 border rounded p-2" placeholder="kcal"
                          value={it.kcal ?? ""} onChange={(e) => updateItem(dIdx, mIdx, iIdx, { kcal: e.target.value === "" ? null : Number(e.target.value) })}
                        />
                        <input
                          type="number" className="col-span-1 border rounded p-2" placeholder="P"
                          value={it.protein_g ?? ""} onChange={(e) => updateItem(dIdx, mIdx, iIdx, { protein_g: e.target.value === "" ? null : Number(e.target.value) })}
                        />
                        <input
                          type="number" className="col-span-1 border rounded p-2" placeholder="C"
                          value={it.carbs_g ?? ""} onChange={(e) => updateItem(dIdx, mIdx, iIdx, { carbs_g: e.target.value === "" ? null : Number(e.target.value) })}
                        />
                        <input
                          type="number" className="col-span-1 border rounded p-2" placeholder="F"
                          value={it.fat_g ?? ""} onChange={(e) => updateItem(dIdx, mIdx, iIdx, { fat_g: e.target.value === "" ? null : Number(e.target.value) })}
                        />
                        <button
                          type="button"
                          className="col-span-12 text-right text-red-600 text-sm"
                          onClick={() => removeItem(dIdx, mIdx, iIdx)}
                        >
                          Rimuovi
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="mt-1 text-indigo-600 text-sm"
                      onClick={() => addItem(dIdx, mIdx)}
                    >
                      + Aggiungi alimento
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3 justify-end">
            <button
              className="px-5 py-3 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              onClick={handleDownloadPDF}
            >
              Scarica PDF
            </button>
            <button
              className={`px-5 py-3 rounded-xl ${disabledSave ? "bg-gray-300 text-white" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
              disabled={disabledSave}
              onClick={handleSave}
              title={disabledSave ? "Salvataggio disponibile solo per 'Me stesso'" : ""}
            >
              Salva nel mio DB
            </button>
          </div>
        </div>

        {/* overlay WARNING (blocca finché non accettato) */}
        {!state.warningAccepted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-3xl w-full bg-white border shadow-xl rounded-2xl p-6">
              <h3 className="text-xl font-bold text-red-700 mb-2">Avvertenze e responsabilità</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Le informazioni fornite in questo piano nutrizionale hanno scopo informativo e non sostituiscono in alcun modo
                il parere di un medico o di un professionista sanitario qualificato. Procedendo, dichiari di essere l’unico
                responsabile delle scelte alimentari e sollevi l’applicazione e i suoi autori da ogni responsabilità per
                eventuali conseguenze derivanti dall’utilizzo di queste indicazioni. In caso di condizioni cliniche, terapie in corso
                o esigenze specifiche, consulta sempre il tuo medico di fiducia. Continuerai solo se accetti integralmente questi termini.
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={() => setState((s) => ({ ...s, warningAccepted: true }))}
                >
                  Accetto e procedo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
