import { useEffect, useMemo, useState } from "react";

/* ===== Tipi ===== */
type Goal =
  | "mantenimento"
  | "aumento_peso"
  | "perdita_peso"
  | "definizione"
  | "massa"
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
  selfCustomerId?: number | null;
  otherPerson: {
    first_name: string;
    last_name: string;
    sex: "M" | "F" | "O";
    age: number | "";
    weight: number | "";
    height: number | "";
  };
  targetCustomerId?: number | null;

  // step di flusso
  consentAccepted: boolean;        // popup consenso
  cheatConfirmed: boolean;         // tabella sgarri confermata
  cheatDays: number[];             // elenco giorni (1..7) di sgarro

  expire: string; // YYYY-MM-DD
  goal: Goal;
  activity: "sedentario" | "leggero" | "moderato" | "intenso" | "atleta";
  notes: string;

  days: NutritionDay[]; // 1..7
};

/* ===== helpers ===== */
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
  if (sex === "O") return base - 78; // tua scelta attuale
  return base;
}

function kcalForGoal(goal: Goal, tdee: number | undefined) {
  if (!tdee) return undefined;
  switch (goal) {
    case "perdita_peso":
    case "definizione":
      return Math.round(tdee * 0.8);
    case "aumento_peso":
    case "massa":
      return Math.round(tdee * 1.15);
    case "mantenimento":
    default:
      return Math.round(tdee);
  }
}

function defaultWeek(): NutritionDay[] {
  const defaultMeals = [
    { position: 1, name: "Colazione", items: [] as FoodRow[] },
    { position: 2, name: "Merenda", items: [] as FoodRow[] },
    { position: 3, name: "Pranzo", items: [] as FoodRow[] },
    { position: 4, name: "Spuntino", items: [] as FoodRow[] },
    { position: 5, name: "Cena", items: [] as FoodRow[] },
  ];
  return Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    meals: JSON.parse(JSON.stringify(defaultMeals)),
  }));
}

function weekdayLabel(n: number) {
  const labels = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
  return labels[(n - 1) % 7];
}

/* ===== COMPONENTE ===== */
export default function NutritionBuilder() {
  // login salvato
  const auth = JSON.parse(localStorage.getItem("authData") || "{}");
  const userType: "utente" | "professionista" | undefined = auth?.user?.type;
  const selfCustomerIdFromLogin: number | null = auth?.user?.customer?.id ?? null;

  const [loadingSelf, setLoadingSelf] = useState(false);
  const [selfData, setSelfData] = useState<UserAnthro>({});
  const [state, setState] = useState<PlanState>({
    ownerMode: "self",
    selfCustomerId: selfCustomerIdFromLogin ?? null,
    otherPerson: {
      first_name: "",
      last_name: "",
      sex: "O",
      age: "",
      weight: "",
      height: "",
    },
    targetCustomerId: null,

    // flusso
    consentAccepted: false,
    cheatConfirmed: false,
    cheatDays: [],

    expire: "",
    goal: "mantenimento",
    activity: "moderato",
    notes: "",
    days: defaultWeek(),
  });

  /* Carica dati self dal login (no fetch) */
  useEffect(() => {
    if (state.ownerMode !== "self") return;
    try {
      setLoadingSelf(true);
      const u = auth?.user || {};
      setSelfData({
        first_name: u.firstName ?? undefined,
        last_name: u.lastName ?? undefined,
        sex: u.sex ?? undefined,
        dob: u.dob ?? undefined,
        weight: u.customer?.weight ?? null,
        height: u.customer?.height ?? null,
      });
      setState((s) => ({ ...s, selfCustomerId: u.customer?.id ?? null }));
    } catch (e) {
      console.error("Errore load self from authData", e);
    } finally {
      setLoadingSelf(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ownerMode]);

  /* Calcoli */
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

  /* Regole pulsante Salva */
  const disabledSave = (() => {
    if (userType === "utente") {
      return !(state.ownerMode === "self" && !!state.selfCustomerId);
    }
    if (userType === "professionista") {
      if (state.ownerMode === "self") return !state.selfCustomerId;
      return !state.targetCustomerId;
    }
    return true;
  })();

  /* Salvataggio */
  const handleSave = async () => {
    if (!state.expire) {
      alert("Inserisci la data di scadenza del piano.");
      return;
    }

    const authLocal = JSON.parse(localStorage.getItem("authData") || "{}");
    const token = authLocal?.token;

    const customerIdFromSelf = state.selfCustomerId ?? null;

    const effectiveCustomerId =
      userType === "utente"
        ? (state.ownerMode === "self" ? customerIdFromSelf : null)
        : userType === "professionista"
        ? (state.ownerMode === "self" ? customerIdFromSelf : (state.targetCustomerId ?? null))
        : null;

    if (!effectiveCustomerId) {
      if (userType === "utente" && state.ownerMode === "other") {
        alert("Non puoi salvare nel DB un piano intestato ad un esterno.");
      } else if (userType === "professionista" && state.ownerMode === "other") {
        alert("Seleziona un customer_id esistente per salvare nel DB.");
      } else {
        alert("Non è disponibile un profilo cliente collegato a questo utente.");
      }
      return;
    }

    try {
      // 1) crea nutrition_plan (inviamo anche gli sgarri come metadato via notes)
      const mergedNotes =
        state.notes?.trim()
          ? `${state.notes.trim()}\n\nSgarri: ${state.cheatDays.sort((a,b)=>a-b).join(", ") || "nessuno"}.`
          : `Sgarri: ${state.cheatDays.sort((a,b)=>a-b).join(", ") || "nessuno"}.`;

      const planRes = await fetch("http://localhost:4000/api/nutrition/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customer_id: effectiveCustomerId,
          expire: state.expire,
          goal: state.goal,
          notes: mergedNotes || null,
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

  /* PDF */
  const handleDownloadPDF = async () => {
    try {
      const creator =
        state.ownerMode === "self"
          ? `${selfData.first_name ?? ""} ${selfData.last_name ?? ""}`.trim() || "Utente"
          : `${state.otherPerson.first_name} ${state.otherPerson.last_name}`.trim() || "Altro soggetto";

      const payload = {
        creator,
        logoPath: "",
        plan: {
          expire: state.expire || null,
          goal: state.goal,
          notes: state.notes || null,
          cheat_days: state.cheatDays.sort((a,b)=>a-b), // extra info nel PDF
          days: state.days.map((d) => ({
            number: d.day,
            meals: d.meals.map((m) => ({
              position: m.position,
              name: m.name,
              notes: m.notes ?? null,
              items: m.items.map((it) => ({
                name: it.description || "",
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

  /* ====== RENDERING STEP-BY-STEP ====== */

  // 1) POPUP NORME & CONSENSO (nessun blur/opacità)
  if (!state.consentAccepted) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-10">
        <div className="bg-white rounded-2xl shadow p-6 border">
          <h2 className="text-2xl font-bold text-indigo-700 mb-3">Informativa & consenso</h2>
          <div className="text-sm text-gray-700 space-y-3">
            <p>
              Questo generatore di piano nutrizionale ha finalità informative ed educative. Non sostituisce il parere di un
              medico o di un professionista sanitario. In presenza di condizioni cliniche, gravidanza, allattamento o terapie
              farmacologiche, consulta il tuo medico prima di adottare qualunque piano alimentare.
            </p>
            <p>
              Dichiari di utilizzare il piano sotto la tua esclusiva responsabilità. Gli autori dell’app non sono responsabili
              per eventuali conseguenze derivanti da un uso improprio delle indicazioni fornite. In caso di dubbi, interrompi
              l’utilizzo e chiedi un parere medico.
            </p>
            <ul className="list-disc ml-5">
              <li>In caso di allergie/intolleranze, verifica sempre gli alimenti inseriti.</li>
              <li>Bevi acqua a sufficienza e monitora segnali di malessere.</li>
              <li>Integra attività fisica in modo proporzionato al tuo livello.</li>
            </ul>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700"
              onClick={() => window.history.back()}
            >
              Annulla
            </button>
            <button
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => setState((s) => ({ ...s, consentAccepted: true }))}
            >
              Accetto e procedo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2) TABELLA SGARRI (7 giorni) prima di mostrare la scheda
  if (!state.cheatConfirmed) {
    const isChecked = (d: number) => state.cheatDays.includes(d);
    const toggleDay = (d: number) =>
      setState((s) => ({
        ...s,
        cheatDays: isChecked(d) ? s.cheatDays.filter((x) => x !== d) : [...s.cheatDays, d],
      }));

    return (
      <div className="w-full max-w-3xl mx-auto mt-10">
        <div className="bg-white rounded-2xl shadow p-6 border">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4">Seleziona i giorni di “sgarro”</h2>
          <p className="text-sm text-gray-600 mb-4">
            Indica uno o più giorni della settimana in cui prevedi maggiore flessibilità alimentare. Potrai comunque modificare
            il piano successivamente. Questa preferenza verrà riportata nelle note del piano e nel PDF.
          </p>

          <table className="w-full text-sm border border-indigo-100 rounded-xl overflow-hidden">
            <thead className="bg-indigo-50">
              <tr>
                <th className="p-3 text-left">Giorno</th>
                <th className="p-3 text-left">Etichetta</th>
                <th className="p-3 text-left">Sgarro</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => (
                <tr key={d} className="border-t">
                  <td className="p-3">#{d}</td>
                  <td className="p-3">{weekdayLabel(d)}</td>
                  <td className="p-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked(d)}
                        onChange={() => toggleDay(d)}
                      />
                      <span>{isChecked(d) ? "Selezionato" : "—"}</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <button
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => setState((s) => ({ ...s, cheatConfirmed: true }))}
            >
              Conferma e continua
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ====== EDITOR COMPLETO (dopo consenso + sgarri) ====== */
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
                <option value="mantenimento">Mantenimento peso</option>
                <option value="perdita_peso">Perdita peso</option>
                <option value="aumento_peso">Aumento peso</option>
                <option value="definizione">Definizione</option>
                <option value="massa">Massa</option>
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
                     onChange={(e) => setState((s)=>({...s, otherPerson: {...s.otherPerson, first_name: e.target.value}}))} />
            </div>
            <div>
              <label className="text-sm text-indigo-700">Cognome</label>
              <input className="w-full p-2 border rounded" value={state.otherPerson.last_name}
                     onChange={(e) => setState((s)=>({...s, otherPerson: {...s.otherPerson, last_name: e.target.value}}))} />
            </div>
            <div>
              <label className="text-sm text-indigo-700">Sesso</label>
              <select className="w-full p-2 border rounded" value={state.otherPerson.sex}
                      onChange={(e) => setState((s)=>({...s, otherPerson: {...s.otherPerson, sex: e.target.value as any}}))}>
                <option value="M">Maschio</option>
                <option value="F">Femmina</option>
                <option value="O">Altro</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-indigo-700">Età</label>
              <input type="number" className="w-full p-2 border rounded" value={state.otherPerson.age}
                     onChange={(e) => setState((s)=>({...s, otherPerson: {...s.otherPerson, age: e.target.value === "" ? "" : Number(e.target.value)}}))} />
            </div>
            <div>
              <label className="text-sm text-indigo-700">Peso (kg)</label>
              <input type="number" className="w-full p-2 border rounded" value={state.otherPerson.weight}
                     onChange={(e) => setState((s)=>({...s, otherPerson: {...s.otherPerson, weight: e.target.value === "" ? "" : Number(e.target.value)}}))} />
            </div>
            <div>
              <label className="text-sm text-indigo-700">Altezza (cm)</label>
              <input type="number" className="w-full p-2 border rounded" value={state.otherPerson.height}
                     onChange={(e) => setState((s)=>({...s, otherPerson: {...s.otherPerson, height: e.target.value === "" ? "" : Number(e.target.value)}}))} />
            </div>
          </div>
        )}

        {/* Solo professionista: selezione customer per “altri” */}
        {state.ownerMode === "other" && userType === "professionista" && (
          <div className="mt-3">
            <label className="block text-sm text-indigo-700 mb-1">
              Cliente destinatario (customer_id esistente)
            </label>
            <input
              type="number"
              className="p-2 rounded-md border border-indigo-200 bg-white"
              value={state.targetCustomerId ?? ""}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  targetCustomerId: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              placeholder="es. 7"
            />
            <p className="text-xs text-gray-500 mt-1">
              (In seguito potrai aggiungere una ricerca nominativa.)
            </p>
          </div>
        )}

        {/* riepilogo fabbisogno */}
        <div className="mt-5 p-4 bg-indigo-50/60 rounded border border-indigo-100 text-sm">
          <div className="flex flex-wrap gap-6">
            <div>BMR: <strong>{derived.BMR ?? "-"}</strong> kcal</div>
            <div>TDEE: <strong>{derived.TDEE ?? "-"}</strong> kcal</div>
            <div>Target: <strong>{derived.targetKcal ?? "-"}</strong> kcal/die</div>
            <div>Sgarri: <strong>{state.cheatDays.length ? state.cheatDays.sort((a,b)=>a-b).map(d => `${weekdayLabel(d)} (#${d})`).join(", ") : "nessuno"}</strong></div>
          </div>
        </div>
      </div>

      {/* EDITOR SETTIMANA */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-bold text-indigo-700 mb-4">Settimana (1..7)</h3>

        <div className="grid md:grid-cols-2 gap-6">
          {state.days.map((d, dIdx) => (
            <div key={d.day} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/40">
              <h4 className="font-semibold text-indigo-700 mb-2">
                Giorno {d.day} — {weekdayLabel(d.day)}
                {state.cheatDays.includes(d.day) && (
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 font-semibold">
                    Sgarro
                  </span>
                )}
              </h4>

              {d.meals.map((m, mIdx) => (
                <div key={m.position} className="mb-4 bg-white rounded p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      className="font-medium flex-1 border rounded p-2"
                      value={m.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setState((s) => {
                          const next = structuredClone(s);
                          next.days[dIdx].meals[mIdx].name = name;
                          return next;
                        });
                      }}
                    />
                    {/* 🔥 rimosso il badge pos:... */}
                  </div>

                  {m.items.map((it, iIdx) => (
                    <div key={iIdx} className="grid grid-cols-12 gap-2 mb-2">
                      <input
                        className="col-span-4 border rounded p-2"
                        placeholder="Alimento o descrizione"
                        value={it.description || ""}
                        onChange={(e) =>
                          setState((s) => {
                            const next = structuredClone(s);
                            next.days[dIdx].meals[mIdx].items[iIdx].description = e.target.value;
                            return next;
                          })
                        }
                      />
                      <input
                        type="number"
                        className="col-span-2 border rounded p-2"
                        value={it.qty}
                        min={0}
                        onChange={(e) =>
                          setState((s) => {
                            const next = structuredClone(s);
                            next.days[dIdx].meals[mIdx].items[iIdx].qty = Number(e.target.value);
                            return next;
                          })
                        }
                      />
                      <select
                        className="col-span-2 border rounded p-2"
                        value={it.unit}
                        onChange={(e) =>
                          setState((s) => {
                            const next = structuredClone(s);
                            next.days[dIdx].meals[mIdx].items[iIdx].unit = e.target.value as any;
                            return next;
                          })
                        }
                      >
                        <option>g</option><option>ml</option><option>pcs</option>
                        <option>cup</option><option>tbsp</option><option>tsp</option><option>slice</option>
                      </select>
                      <input
                        type="number" className="col-span-1 border rounded p-2" placeholder="kcal"
                        value={it.kcal ?? ""} onChange={(e) =>
                          setState((s) => {
                            const next = structuredClone(s);
                            next.days[dIdx].meals[mIdx].items[iIdx].kcal = e.target.value === "" ? null : Number(e.target.value);
                            return next;
                          })
                        }
                      />
                      <input
                        type="number" className="col-span-1 border rounded p-2" placeholder="P"
                        value={it.protein_g ?? ""} onChange={(e) =>
                          setState((s) => {
                            const next = structuredClone(s);
                            next.days[dIdx].meals[mIdx].items[iIdx].protein_g = e.target.value === "" ? null : Number(e.target.value);
                            return next;
                          })
                        }
                      />
                      <input
                        type="number" className="col-span-1 border rounded p-2" placeholder="C"
                        value={it.carbs_g ?? ""} onChange={(e) =>
                          setState((s) => {
                            const next = structuredClone(s);
                            next.days[dIdx].meals[mIdx].items[iIdx].carbs_g = e.target.value === "" ? null : Number(e.target.value);
                            return next;
                          })
                        }
                      />
                      <input
                        type="number" className="col-span-1 border rounded p-2" placeholder="F"
                        value={it.fat_g ?? ""} onChange={(e) =>
                          setState((s) => {
                            const next = structuredClone(s);
                            next.days[dIdx].meals[mIdx].items[iIdx].fat_g = e.target.value === "" ? null : Number(e.target.value);
                            return next;
                          })
                        }
                      />
                      <button
                        type="button"
                        className="col-span-12 text-right text-red-600 text-sm"
                        onClick={() =>
                          setState((s) => {
                            const next = structuredClone(s);
                            next.days[dIdx].meals[mIdx].items.splice(iIdx, 1);
                            return next;
                          })
                        }
                      >
                        Rimuovi
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="mt-1 text-indigo-600 text-sm"
                    onClick={() =>
                      setState((s) => {
                        const next = structuredClone(s);
                        next.days[dIdx].meals[mIdx].items.push({
                          qty: 100,
                          unit: "g",
                          description: "",
                        });
                        return next;
                      })
                    }
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
            title={
              disabledSave
                ? (userType === "utente"
                    ? (state.ownerMode === "other"
                        ? "Gli utenti non possono salvare piani per esterni"
                        : "Profilo cliente mancante")
                    : (state.ownerMode === "other"
                        ? "Seleziona un customer_id esistente"
                        : "Profilo cliente mancante"))
                : ""
            }
          >
            Salva nel DB
          </button>
        </div>
      </div>
    </div>
  );
}
