import { useEffect, useMemo, useState } from "react";
import FoodAsyncSelect from "../components/FoodAsyncSelect";
import type { FoodApi as FoodApiType } from "../components/FoodAsyncSelect";


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
  id?: number | null;       // foods.id se presente
  description?: string;     // testo libero
  qty: number;              // quantità inserita dall'utente
  unit: "g" | "ml" | "pcs" | "cup" | "tbsp" | "tsp" | "slice";

  // valori correnti calcolati (sola visualizzazione)
  kcal?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;

  // meta locali per calcolo dinamico (NON salvate nel DB)
  _per100?: {
    kcal?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
    fiber?: number | null;
  } | null;
};

type Meal = {
  position: number;
  name: string;
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

  consentAccepted: boolean;
  cheatConfirmed: boolean;
  cheatDays: number[];

  expire: string; // YYYY-MM-DD
  goal: Goal;
  activity: "sedentario" | "leggero" | "moderato" | "intenso" | "atleta";
  notes: string;

  days: NutritionDay[];
  showPreview?: boolean;
};

type MeResponse = {
  id: number;
  username: string;
  email: string;
  type: "utente" | "professionista";
  first_name?: string | null;
  last_name?: string | null;
  sex?: "M" | "F" | "O" | null;
  dob?: string | null;
  customer?: { id: number; weight: number | null; height: number | null } | null;
  freelancer?: { id: number; vat: string } | null;
};

/* ===== helpers ===== */
const activityFactor: Record<PlanState["activity"], number> = {
  sedentario: 1.2,
  leggero: 1.375,
  moderato: 1.55,
  intenso: 1.725,
  atleta: 1.9,
};

function weekdayLabel(n: number) {
  const labels = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
  return labels[(n - 1) % 7];
}

function defaultWeek(): NutritionDay[] {
  const defaultMeals = [
    { position: 1, name: "Colazione", items: [] as FoodRow[] },
    { position: 2, name: "Merenda", items: [] as FoodRow[] },
    { position: 3, name: "Pranzo", items: [] as FoodRow[] },
    { position: 4, name: "Spuntino", items: [] as FoodRow[] },
    { position: 5, name: "Cena", items: [] as FoodRow[] },
  ];
  // almeno 1 riga vuota per ogni pasto
  const withOneRow = defaultMeals.map((m) => ({
    ...m,
    items: [
      {
        qty: 100,
        unit: "g",
        description: "",
        kcal: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        fiber_g: null,
        _per100: null,
      },
    ],
  }));
  return Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    meals: JSON.parse(JSON.stringify(withOneRow)),
  }));
}

/** Legge authData dal localStorage (supporta schema “completo” e “ridotto”) */
function readAuthSnapshot() {
  const raw = JSON.parse(localStorage.getItem("authData") || "{}");
  const userFull = raw?.user ?? {};
  const role = raw?.role ?? raw?.user?.type ?? null;

  return {
    token: raw?.token ?? null,
    user: {
      id: userFull.id ?? raw?.userId ?? null,
      username: userFull.username ?? raw?.username ?? null,
      firstName: userFull.firstName ?? userFull.first_name ?? null,
      lastName: userFull.lastName ?? userFull.last_name ?? null,
      type: userFull.type ?? role ?? null,
      sex: userFull.sex ?? null,
      dob: userFull.dob ?? null,
      customer: userFull.customer ?? null,
    },
  };
}

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
  if (sex === "O") return base - 78;
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

/** Calcolo dinamico macro per una riga, usando per-100 + qty + unit */
function computeRowMacros(row: FoodRow): Required<Pick<FoodRow, "kcal" | "protein_g" | "carbs_g" | "fat_g" | "fiber_g">> {
  const per100 = row._per100 ?? null;
  let factor = 0;

  if (per100) {
    if (row.unit === "g" || row.unit === "ml") {
      factor = (row.qty || 0) / 100;
    } else {
      // per unità a pezzi: per ora assumiamo che per-UNIT = per-100
      factor = row.qty || 0;
    }
    const kcal = per100.kcal ? per100.kcal * factor : 0;
    const p = per100.protein ? per100.protein * factor : 0;
    const c = per100.carbs ? per100.carbs * factor : 0;
    const f = per100.fat ? per100.fat * factor : 0;
    const fi = per100.fiber ? per100.fiber * factor : 0;

    return {
      kcal: Math.round(kcal || 0),
      protein_g: Number(p?.toFixed(1) || 0),
      carbs_g: Number(c?.toFixed(1) || 0),
      fat_g: Number(f?.toFixed(1) || 0),
      fiber_g: Number(fi?.toFixed(1) || 0),
    };
  }

  // fallback: se abbiamo valori già salvati nella riga
  return {
    kcal: Math.round(row.kcal || 0),
    protein_g: Number((row.protein_g || 0).toFixed(1)),
    carbs_g: Number((row.carbs_g || 0).toFixed(1)),
    fat_g: Number((row.fat_g || 0).toFixed(1)),
    fiber_g: Number((row.fiber_g || 0).toFixed(1)),
  };
}

/** Assicura almeno 1 riga per ogni pasto dei giorni editabili */
function ensureOneRowPerMeal(days: NutritionDay[], skipDays: number[]): NutritionDay[] {
  const next = structuredClone(days) as NutritionDay[];
  for (const d of next) {
    if (skipDays.includes(d.day)) continue;
    for (const meal of d.meals) {
      if (!meal.items || meal.items.length === 0) {
        meal.items = [
          {
            qty: 100,
            unit: "g",
            description: "",
            kcal: null,
            protein_g: null,
            carbs_g: null,
            fat_g: null,
            fiber_g: null,
            _per100: null,
          },
        ];
      }
    }
  }
  return next;
}

/** Converte una riga in un value compatibile con FoodAsyncSelect */
function foodApiFromRow(row: FoodRow): FoodApiType | null {
  if (!row?.id || !row?.description) return null;
  return {
    id: row.id,
    name: row.description,
    default_unit: row.unit,
    kcal_per_100: row._per100?.kcal ?? null,
    protein_per_100: row._per100?.protein ?? null,
    carbs_per_100: row._per100?.carbs ?? null,
    fat_per_100: row._per100?.fat ?? null,
    fiber_per_100: row._per100?.fiber ?? null,
  };
}

/* ===== COMPONENTE ===== */
export default function NutritionPage() {
  const { user, token } = readAuthSnapshot();
  const [userType, setUserType] = useState<"utente" | "professionista" | "admin" | undefined>(undefined);
  const selfCustomerIdFromLogin: number | null = user.customer?.id ?? null;

  const [loadingSelf, setLoadingSelf] = useState(false);
  const [selfData, setSelfData] = useState<UserAnthro>({});

  const [state, setState] = useState<PlanState>({
    ownerMode: "self",
    selfCustomerId: selfCustomerIdFromLogin ?? null,
    otherPerson: { first_name: "", last_name: "", sex: "O", age: "", weight: "", height: "" },
    targetCustomerId: null,

    consentAccepted: false,
    cheatConfirmed: false,
    cheatDays: [],

    expire: "",
    goal: "mantenimento",
    activity: "moderato",
    notes: "",
    days: defaultWeek(),
    showPreview: false,
  });

  /* /api/me + (se sgarri confermati) prefill ultimo piano */
  useEffect(() => {
    if (state.ownerMode !== "self") return;

    const tkn = token;
    if (!tkn) {
      setSelfData({});
      setState((s) => ({ ...s, selfCustomerId: null }));
      setUserType(undefined);
      return;
    }

    (async () => {
      try {
        setLoadingSelf(true);

        // 1) /api/me  → autocompilazione
        const res = await fetch("http://localhost:4000/api/me", {
          headers: { Authorization: `Bearer ${tkn}` },
        });
        if (!res.ok) throw new Error("Impossibile ottenere /api/me");
        const me: MeResponse = await res.json();

        setSelfData({
          first_name: me.first_name ?? undefined,
          last_name: me.last_name ?? undefined,
          sex: (me.sex ?? undefined) as any,
          dob: me.dob ?? undefined,
          weight: me.customer?.weight ?? null,
          height: me.customer?.height ?? null,
        });

        setState((s) => ({
          ...s,
          selfCustomerId: me.customer?.id ?? null,
        }));
        setUserType(me.type);

        // 2) prefill ultimo piano (solo dopo conferma sgarri)
        if (state.cheatConfirmed && me.customer?.id) {
          const latest = await fetch(
            `http://localhost:4000/api/nutrition/plans/latest?customer_id=${me.customer.id}`,
            { headers: { Authorization: `Bearer ${tkn}` } }
          );

          if (latest.ok) {
            const data = (await latest.json()) as {
              expire?: string | null;
              goal?: Goal | null;
              notes?: string | null;
              days?: Array<{
                day: number;
                meals: Array<{
                  position: number;
                  name: string;
                  notes: string | null;
                  items: Array<{
                    food_id: number | null;
                    description: string | null;
                    qty: number | null;
                    unit: "g" | "ml" | "pcs" | "cup" | "tbsp" | "tsp" | "slice";
                    kcal: number | null;
                    protein_g: number | null;
                    carbs_g: number | null;
                    fat_g: number | null;
                  }>;
                }>;
              }>;
            };

            const base = defaultWeek();
            for (const d of data.days ?? []) {
              const targetDay = base.find((x) => x.day === d.day);
              if (!targetDay) continue;

              for (const m of d.meals ?? []) {
                const targetMeal = targetDay.meals.find((x) => x.position === m.position);
                if (!targetMeal) continue;

                targetMeal.name = m.name || targetMeal.name;
                targetMeal.notes = m.notes || undefined;
                targetMeal.items = (m.items ?? []).map((it) => ({
                  id: it.food_id ?? null,
                  description: it.description ?? "",
                  qty: it.qty ?? 100,
                  unit: it.unit ?? "g",
                  // pre-carico i valori salvati (visual fallback)
                  kcal: it.kcal,
                  protein_g: it.protein_g,
                  carbs_g: it.carbs_g,
                  fat_g: it.fat_g,
                  fiber_g: null,
                  _per100: null, // si popola se selezioni dal catalogo
                }));
              }
            }

            const withMinRows = ensureOneRowPerMeal(base, state.cheatDays);
            setState((s) => ({
              ...s,
              expire: s.expire || (data.expire ?? ""),
              goal: (data.goal as Goal) || s.goal,
              notes: s.notes || (data.notes ?? ""),
              days: withMinRows,
            }));
          }
        }
      } catch (e) {
        console.error("Errore /api/me o /latest", e);
        setUserType((user?.type as any) ?? undefined);
      } finally {
        setLoadingSelf(false);
      }
    })();
  }, [state.ownerMode, state.cheatConfirmed, state.cheatDays, user?.type, token]);

  /* Calcoli globali */
  const derived = useMemo(() => {
    const sex = state.ownerMode === "self" ? selfData.sex : state.otherPerson.sex;
    const weight =
      state.ownerMode === "self" ? selfData.weight ?? undefined : (state.otherPerson.weight as number | undefined);
    const height =
      state.ownerMode === "self" ? selfData.height ?? undefined : (state.otherPerson.height as number | undefined);
    const age = state.ownerMode === "self" ? ageFromDOB(selfData.dob) : (state.otherPerson.age as number | undefined);

    const BMR = bmr(sex, weight, height, age);
    const TDEE = BMR ? BMR * activityFactor[state.activity] : undefined;
    const target = kcalForGoal(state.goal, TDEE);
    return { BMR: BMR ? Math.round(BMR) : undefined, TDEE: TDEE ? Math.round(TDEE) : undefined, targetKcal: target };
  }, [state.ownerMode, selfData, state.otherPerson, state.activity, state.goal]);

  /* ========== UI STEP-BY-STEP ========== */

  // 1) POPUP CONSENSO
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
              <li>Bevi acqua a sufficienza e monitora eventuali segnali di malessere.</li>
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

  // 2) SGARRI con pulsanti toggle (blu → verde)
  if (!state.cheatConfirmed) {
    const toggleDay = (d: number) =>
      setState((s) => ({
        ...s,
        cheatDays: s.cheatDays.includes(d) ? s.cheatDays.filter((x) => x !== d) : [...s.cheatDays, d],
      }));

    return (
      <div className="w-full max-w-3xl mx-auto mt-10">
        <div className="bg-white rounded-2xl shadow p-6 border">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4">Seleziona i giorni di “sgarro”</h2>
          <p className="text-sm text-gray-600 mb-4">
            Clicca sui giorni: diventano verdi quando sono marcati come sgarro. Potrai cambiarli in seguito.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => {
              const active = state.cheatDays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`px-4 py-3 rounded-xl text-white font-medium transition
                    ${active ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                >
                  {weekdayLabel(d)}
                </button>
              );
            })}
          </div>

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

  /* ====== EDITOR + PREVIEW ====== */
  const editableDays = state.days.filter((d) => !state.cheatDays.includes(d.day));

  // PREVIEW: qui appaiono anche Scarica PDF / Salva nel DB
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
          cheat_days: state.cheatDays.sort((a, b) => a - b),
          days: editableDays.map((d) => ({
            number: d.day,
            meals: d.meals.map((m) => ({
              position: m.position,
              name: m.name,
              notes: m.notes ?? null,
              items: m.items.map((it) => {
                const v = computeRowMacros(it);
                return {
                  name: it.description || "",
                  qty: it.qty,
                  unit: it.unit,
                  kcal: v.kcal,
                  protein_g: v.protein_g,
                  carbs_g: v.carbs_g,
                  fat_g: v.fat_g,
                };
              }),
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

  const disabledSave =
    userType === "utente"
      ? !(state.ownerMode === "self" && !!state.selfCustomerId)
      : (userType === "professionista" || userType === "admin")
      ? (state.ownerMode === "self" ? !state.selfCustomerId : !state.targetCustomerId)
      : true;

  const handleSave = async () => {
    if (!state.expire) {
      alert("Inserisci la data di scadenza del piano.");
      return;
    }

    const effectiveCustomerId =
      userType === "utente"
        ? state.ownerMode === "self"
          ? state.selfCustomerId ?? null
          : null
        : state.ownerMode === "self"
        ? state.selfCustomerId ?? null
        : state.targetCustomerId ?? null;

    if (!effectiveCustomerId) {
      if (userType === "utente" && state.ownerMode === "other") {
        alert("Non puoi salvare nel DB un piano intestato a un esterno.");
      } else if ((userType === "professionista" || userType === "admin") && state.ownerMode === "other") {
        alert("Seleziona un customer_id esistente per salvare nel DB.");
      } else {
        alert("Profilo cliente mancante.");
      }
      return;
    }

    try {
      const mergedNotes = state.notes?.trim()
        ? `${state.notes.trim()}\n\nSgarri: ${state.cheatDays.sort((a, b) => a - b).join(", ") || "nessuno"}.`
        : `Sgarri: ${state.cheatDays.sort((a, b) => a - b).join(", ") || "nessuno"}.`;

      const tkn = token;

      // 1) crea plan
      const planRes = await fetch("http://localhost:4000/api/nutrition/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}),
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

      // 2) giorni NON sgarro
      const dayIdMap: Record<number, number> = {};
      for (const d of editableDays) {
        const dRes = await fetch("http://localhost:4000/api/nutrition/days", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}),
          },
          body: JSON.stringify({ plan_id: planId, day: d.day }),
        });
        if (!dRes.ok) throw new Error("Errore creazione giorno");
        const dj = await dRes.json();
        dayIdMap[d.day] = dj.id;
      }

      // 3) meals
      const mealIdMap: Record<string, number> = {};
      for (const d of editableDays) {
        const day_id = dayIdMap[d.day];
        for (const meal of d.meals) {
          const mRes = await fetch("http://localhost:4000/api/nutrition/meals", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}),
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

      // 4) items (macro calcolate al volo)
      const itemsPayload = editableDays.flatMap((d) =>
        d.meals.flatMap((meal) =>
          meal.items.map((it, idx) => {
            const v = computeRowMacros(it);
            return {
              meal_id: mealIdMap[`${d.day}-${meal.position}`],
              position: idx + 1,
              food_id: it.id ?? null,
              description: it.description || null,
              qty: it.qty ?? null,
              unit: it.unit,
              kcal: v.kcal ?? null,
              protein_g: v.protein_g ?? null,
              carbs_g: v.carbs_g ?? null,
              fat_g: v.fat_g ?? null,
              // fiber_g non presente in nutrition_items → omesso
            };
          })
        )
      );

      if (itemsPayload.length) {
        const iRes = await fetch("http://localhost:4000/api/nutrition/items/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}),
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

  if (state.showPreview) {
    return (
      <div className="w-full max-w-5xl mx-auto mt-8 bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">Anteprima piano nutrizionale</h2>

        <div className="mb-4 text-sm text-gray-700">
          <div className="flex flex-wrap gap-6">
            <div><strong>Scadenza:</strong> {state.expire || "—"}</div>
            <div><strong>Obiettivo:</strong> {state.goal}</div>
            <div><strong>Attività:</strong> {state.activity}</div>
            <div><strong>BMR:</strong> {derived.BMR ?? "—"} kcal</div>
            <div><strong>TDEE:</strong> {derived.TDEE ?? "—"} kcal</div>
            <div><strong>Target:</strong> {derived.targetKcal ?? "—"} kcal/die</div>
            <div>
              <strong>Sgarri:</strong>{" "}
              {state.cheatDays.length
                ? state.cheatDays.sort((a, b) => a - b).map((d) => weekdayLabel(d)).join(", ")
                : "nessuno"}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {editableDays.map((d) => (
            <div key={d.day} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold">Giorno {d.day} — {weekdayLabel(d.day)}</h4>
              </div>
              <div className="space-y-2 text-sm">
                {d.meals.map((m, i) => (
                  <div key={i}>
                    <div className="font-semibold">{m.name}</div>
                    {m.items.length ? (
                      <ul className="list-disc ml-5">
                        {m.items.map((it, idx) => {
                          const v = computeRowMacros(it);
                          return (
                            <li key={idx}>
                              {it.description || "—"} — {it.qty}{it.unit}{v.kcal ? `, ${v.kcal} kcal` : ""}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-gray-500">Nessun alimento inserito</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottoni SOLO in anteprima */}
        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button
            className="px-5 py-3 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            onClick={() => setState((s) => ({ ...s, showPreview: false }))}
          >
            Torna alla modifica
          </button>
          <button className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={handleDownloadPDF}>
            Scarica PDF
          </button>
          <button
            className={`px-5 py-3 rounded-xl ${disabledSave ? "bg-gray-300 text-white" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
            disabled={disabledSave}
            onClick={handleSave}
          >
            Salva nel DB
          </button>
        </div>
      </div>
    );
  }

  // EDITOR: tabella unica a tutta larghezza, macro non editabili, bottone rimuovi a sinistra
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* intestazione/owner */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <div className="flex items-start gap-3 justify-between">
          <h2 className="text-2xl font-bold text-indigo-700">Crea piano nutrizionale</h2>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm"
              onClick={() => setState((s) => ({ ...s, cheatConfirmed: false }))}
              title="Torna alla scelta dei giorni di sgarro"
            >
              Modifica sgarri
            </button>
            <button
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
              onClick={() => setState((s) => ({ ...s, showPreview: true }))}
            >
              Anteprima
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end mt-4">
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
              <input
                className="w-full p-2 border rounded"
                value={state.otherPerson.first_name}
                onChange={(e) => setState((s) => ({ ...s, otherPerson: { ...s.otherPerson, first_name: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-sm text-indigo-700">Cognome</label>
              <input
                className="w-full p-2 border rounded"
                value={state.otherPerson.last_name}
                onChange={(e) => setState((s) => ({ ...s, otherPerson: { ...s.otherPerson, last_name: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-sm text-indigo-700">Sesso</label>
              <select
                className="w-full p-2 border rounded"
                value={state.otherPerson.sex}
                onChange={(e) => setState((s) => ({ ...s, otherPerson: { ...s.otherPerson, sex: e.target.value as any } }))}
              >
                <option value="M">Maschio</option>
                <option value="F">Femmina</option>
                <option value="O">Altro</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-indigo-700">Età</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={state.otherPerson.age}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    otherPerson: { ...s.otherPerson, age: e.target.value === "" ? "" : Number(e.target.value) },
                  }))
                }
              />
            </div>
            <div>
              <label className="text-sm text-indigo-700">Peso (kg)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={state.otherPerson.weight}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    otherPerson: { ...s.otherPerson, weight: e.target.value === "" ? "" : Number(e.target.value) },
                  }))
                }
              />
            </div>
            <div>
              <label className="text-sm text-indigo-700">Altezza (cm)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={state.otherPerson.height}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    otherPerson: { ...s.otherPerson, height: e.target.value === "" ? "" : Number(e.target.value) },
                  }))
                }
              />
            </div>
          </div>
        )}

        {/* riepilogo fabbisogno */}
        <div className="mt-5 p-4 bg-indigo-50/60 rounded border border-indigo-100 text-sm">
          <div className="flex flex-wrap gap-6">
            <div>BMR: <strong>{derived.BMR ?? "-"}</strong> kcal</div>
            <div>TDEE: <strong>{derived.TDEE ?? "-"}</strong> kcal</div>
            <div>Target: <strong>{derived.targetKcal ?? "-"}</strong> kcal/die</div>
            <div>
              Sgarri:{" "}
              <strong>
                {state.cheatDays.length
                  ? state.cheatDays.sort((a, b) => a - b).map((d) => weekdayLabel(d)).join(", ")
                  : "nessuno"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* EDITOR SETTIMANA: tabella unica a tutta larghezza */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-bold text-indigo-700 mb-4">Settimana (giorni senza sgarro)</h3>

        {editableDays.length === 0 ? (
          <div className="text-sm text-gray-600">
            Hai selezionato tutti i giorni come sgarro. Torna su <em>Modifica sgarri</em> per liberarne almeno uno. 🙂
          </div>
        ) : (
          <div className="space-y-8">
            {editableDays.map((d) => (
              <div key={d.day} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/40">
                <h4 className="font-semibold text-indigo-700 mb-3">
                  Giorno {d.day} — {weekdayLabel(d.day)}
                </h4>

                {/* TABELLA UNICA FULL WIDTH */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-indigo-100 rounded-xl overflow-hidden">
                    <thead className="bg-indigo-50">
                      <tr>
                        <th className="p-2 text-left w-10"> </th>
                        <th className="p-2 text-left">Pasto</th>
                        <th className="p-2 text-left">Alimento / descrizione</th>
                        <th className="p-2 text-left">Qty</th>
                        <th className="p-2 text-left">Unità</th>
                        <th className="p-2 text-left">kcal</th>
                        <th className="p-2 text-left">Prot</th>
                        <th className="p-2 text-left">Carb</th>
                        <th className="p-2 text-left">Fibre</th>
                        <th className="p-2 text-left">Grassi</th>
                      </tr>
                    </thead>

                    <tbody>
                      {d.meals.flatMap((meal, mIdx) =>
                        meal.items.map((row, iIdx) => {
                          const values = computeRowMacros(row);

                          return (
                            <tr key={`${meal.position}-${iIdx}`} className="border-t align-top">
                              {/* elimina riga */}
                              <td className="p-2">
                                <button
                                  type="button"
                                  className="px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() =>
                                    setState((s) => {
                                      const next = structuredClone(s);
                                      const dayIndex = next.days.findIndex((x) => x.day === d.day);
                                      next.days[dayIndex].meals[mIdx].items.splice(iIdx, 1);
                                      // se il pasto resta senza righe → reinserisco una riga vuota
                                      if (next.days[dayIndex].meals[mIdx].items.length === 0) {
                                        next.days[dayIndex].meals[mIdx].items.push({
                                          qty: 100,
                                          unit: "g",
                                          description: "",
                                          kcal: null,
                                          protein_g: null,
                                          carbs_g: null,
                                          fat_g: null,
                                          fiber_g: null,
                                          _per100: null,
                                        });
                                      }
                                      return next;
                                    })
                                  }
                                  title="Elimina riga"
                                >
                                  ✕
                                </button>
                              </td>

                              {/* PASTO (select per spostare la riga tra i pasti) */}
                              <td className="p-2">
                                <select
                                  className="w-full border rounded p-2"
                                  value={meal.position}
                                  onChange={(e) =>
                                    setState((s) => {
                                      const next = structuredClone(s);
                                      const dayIndex = next.days.findIndex((x) => x.day === d.day);
                                      const fromMealIdx = mIdx;
                                      const toPos = Number(e.target.value);
                                      // sposta l'item
                                      const moved = next.days[dayIndex].meals[fromMealIdx].items.splice(iIdx, 1)[0];
                                      const toMealIdx = next.days[dayIndex].meals.findIndex((mm) => mm.position === toPos);
                                      if (toMealIdx >= 0) {
                                        next.days[dayIndex].meals[toMealIdx].items.push(moved);
                                      }
                                      // riga minima
                                      if (next.days[dayIndex].meals[fromMealIdx].items.length === 0) {
                                        next.days[dayIndex].meals[fromMealIdx].items.push({
                                          qty: 100,
                                          unit: "g",
                                          description: "",
                                          kcal: null,
                                          protein_g: null,
                                          carbs_g: null,
                                          fat_g: null,
                                          fiber_g: null,
                                          _per100: null,
                                        });
                                      }
                                      return next;
                                    })
                                  }
                                >
                                  {d.meals.map((opt) => (
                                    <option key={opt.position} value={opt.position}>
                                      {opt.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* ALIMENTO: react-select async */}
                              <td className="p-2 min-w-[280px]">
                                <FoodAsyncSelect
                                  token={token}
                                  value={foodApiFromRow(row)}
                                  onChange={(food) => {
                                    setState((s) => {
                                      const next = structuredClone(s);
                                      const dayIndex = next.days.findIndex((x) => x.day === d.day);
                                      const target = next.days[dayIndex].meals[mIdx].items[iIdx];

                                      if (food) {
                                        target.id = food.id;
                                        target.description = food.name;
                                        target._per100 = {
                                          kcal: food.kcal_per_100,
                                          protein: food.protein_per_100,
                                          carbs: food.carbs_per_100,
                                          fat: food.fat_per_100,
                                          fiber: food.fiber_per_100 ?? null,
                                        };
                                        // opzionale: usa unit di default del food
                                        target.unit = food.default_unit;
                                      } else {
                                        // clear selezione
                                        target.id = null;
                                        target._per100 = null;
                                        // se vuoi svuotare anche il testo:
                                        // target.description = "";
                                      }
                                      return next;
                                    });
                                  }}
                                  placeholder="Cerca alimento…"
                                />
                              </td>

                              {/* QTY */}
                              <td className="p-2">
                                <input
                                  type="number"
                                  className="w-full border rounded p-2"
                                  min={0}
                                  value={row.qty}
                                  onChange={(e) =>
                                    setState((s) => {
                                      const next = structuredClone(s);
                                      const dayIndex = next.days.findIndex((x) => x.day === d.day);
                                      next.days[dayIndex].meals[mIdx].items[iIdx].qty = Number(e.target.value);
                                      return next;
                                    })
                                  }
                                />
                              </td>

                              {/* UNIT */}
                              <td className="p-2">
                                <select
                                  className="w-full border rounded p-2"
                                  value={row.unit}
                                  onChange={(e) =>
                                    setState((s) => {
                                      const next = structuredClone(s);
                                      const dayIndex = next.days.findIndex((x) => x.day === d.day);
                                      next.days[dayIndex].meals[mIdx].items[iIdx].unit = e.target.value as FoodRow["unit"];
                                      return next;
                                    })
                                  }
                                >
                                  <option>g</option>
                                  <option>ml</option>
                                  <option>pcs</option>
                                  <option>cup</option>
                                  <option>tbsp</option>
                                  <option>tsp</option>
                                  <option>slice</option>
                                </select>
                              </td>

                              {/* MACRO (non editabili) */}
                              <td className="p-2 align-middle">{values.kcal || 0}</td>
                              <td className="p-2 align-middle">{values.protein_g || 0}</td>
                              <td className="p-2 align-middle">{values.carbs_g || 0}</td>
                              <td className="p-2 align-middle">{values.fiber_g || 0}</td>
                              <td className="p-2 align-middle">{values.fat_g || 0}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Aggiungi riga per un pasto specifico */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-600">Aggiungi riga sul pasto:</span>
                  <select
                    className="border rounded p-2 text-sm"
                    onChange={(e) =>
                      setState((s) => {
                        if (e.target.value === "") return s;
                        const next = structuredClone(s);
                        const dayIndex = next.days.findIndex((x) => x.day === d.day);
                        const toPos = Number(e.target.value);
                        const toMealIdx = next.days[dayIndex].meals.findIndex((mm) => mm.position === toPos);
                        if (toMealIdx >= 0) {
                          next.days[dayIndex].meals[toMealIdx].items.push({
                            qty: 100,
                            unit: "g",
                            description: "",
                            kcal: null,
                            protein_g: null,
                            carbs_g: null,
                            fat_g: null,
                            fiber_g: null,
                            _per100: null,
                          });
                        }
                        (e.target as HTMLSelectElement).value = "";
                        return next;
                      })
                    }
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Seleziona pasto…
                    </option>
                    {d.meals.map((m) => (
                      <option key={m.position} value={m.position}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
