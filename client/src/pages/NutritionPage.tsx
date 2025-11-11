import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import FoodAsyncSelect from "../components/FoodAsyncSelect";
import Html2CanvasExportButton from "../components/Html2CanvasExportButton";
import ExportNutritionPreview, { type ExportDay } from "../export/ExportNutritionPreview";

import type { FoodApi as FoodApiType } from "../components/FoodAsyncSelect";
import { api } from "../services/api";

import { usePageTitle } from "../hooks/usePageTitle";

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
  dob?: string;
  weight?: number | null;
  height?: number | null;
};

type FoodRow = {
  id?: number | null; // food_id (DB)
  description?: string;
  qty: number;
  unit: "g" | "ml" | "pcs" | "cup" | "tbsp" | "tsp" | "slice";
  kcal?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  _per100?:
    | {
        kcal?: number | null;
        protein?: number | null;
        carbs?: number | null;
        fat?: number | null;
        fiber?: number | null;
      }
    | null;
};

type Meal = {
  position: number;
  name: string;
  notes?: string;
  items: FoodRow[];
};

type NutritionDay = {
  day: number;
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
  expire: string;
  goal: Goal;
  activity: "sedentario" | "leggero" | "moderato" | "intenso" | "atleta";
  notes: string;
  days: NutritionDay[];
  showPreview?: boolean;
};

type MeResponse = {
  id: number;
  username: string;
  email: string | null;
  type: "utente" | "professionista";
  first_name?: string | null;
  last_name?: string | null;
  sex?: "M" | "F" | "O" | null;
  dob?: string | null;

  height?: number | null;
  latest_weight?: number | null;

  user?: {
    height?: number | null;
    weight?: number | null;
    first_name?: string | null;
    last_name?: string | null;
    sex?: "M" | "F" | "O" | null;
    dob?: string | null;
    type?: "utente" | "professionista";
    customer?: { id: number; weight: number | null; height: number | null } | null;
  } | null;

  customer?: { id: number; weight: number | null; height: number | null } | null;
  freelancer?: { id: number; vat: string } | null;
};

type ItemFromDetail = {
  id: number;
  position: number;
  label: string;
  qty: number | null;
  unit: string | null;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g?: number | null;
  food_id?: number | null;
};

type MealFromDetail = {
  id: number;
  position: number;
  name: string;
  notes: string | null;
  items: ItemFromDetail[];
};

type DayFromDetail = {
  id: number;
  day: number;
  meals: MealFromDetail[];
};

type PlanDetailFromState = {
  id: number;
  goal: string;
  expire: string | null;
  creator?: string;
  freelancer_id?: number | null;
  customer_id?: number | null;
  creator_user_id?: number | null;
  creator_first_name?: string | null;
  creator_last_name?: string | null;
  days: DayFromDetail[];
};

/* ===== helpers ===== */
const activityFactor: Record<PlanState["activity"], number> = {
  sedentario: 1.2,
  leggero: 1.375,
  moderato: 1.55,
  intenso: 1.725,
  atleta: 1.9,
};

const MEAL_TYPES = ["Colazione", "Merenda", "Pranzo", "Spuntino", "Cena"] as const;
const MEAL_POS: Record<string, number> = {
  Colazione: 1,
  Merenda: 2,
  Pranzo: 3,
  Spuntino: 4,
  Cena: 5,
};

type CustomerDetail = {
  customer_id: number;
  user_id: number;
  username: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  sex: "M" | "F" | "O" | null;
  dob: string | null;
  height: number | null;
  latest_weight: number | null;
};

const MAX_CHEATS = 3;

// etichetta ogni giorno con un numero
function weekdayLabel(n: number) {
  const labels = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
  return labels[(n - 1) % 7];
}

// Funzione che mette automaticamente le celle iniziali
function defaultWeek(): NutritionDay[] {
  const defaultMeals: Meal[] = [
    { position: 1, name: "Colazione", items: [] },
    { position: 2, name: "Merenda", items: [] },
    { position: 3, name: "Pranzo", items: [] },
    { position: 4, name: "Spuntino", items: [] },
    { position: 5, name: "Cena", items: [] },
  ];
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

// prende i dati dell'utente loggato
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

// Calcola l'età
function ageFromDOB(dob?: string | null): number | undefined {
  if (!dob) return undefined;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

// Calcolo BMR
function bmr(sex: "M" | "F" | "O" | undefined, weightKg?: number, heightCm?: number, ageYears?: number) {
  if (!weightKg || !heightCm || !ageYears) return undefined;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (sex === "M") return base + 5;
  if (sex === "F") return base - 161;
  if (sex === "O") return base - 78;
  return base;
}

// Calcolo kcal per obiettivo
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

// Converte un valore in numero (per la funzione dopo)
function asNumber(v: any): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Calcola i macronutrienti di una riga
function computeRowMacros(
  row: FoodRow
): Required<Pick<FoodRow, "kcal" | "protein_g" | "carbs_g" | "fat_g" | "fiber_g">> {
  const per100 = row._per100 ?? null;
  let factor = 0;

  if (per100) {
    if (row.unit === "g" || row.unit === "ml") factor = asNumber(row.qty) / 100;
    else factor = asNumber(row.qty);

    const kcal = asNumber(per100.kcal) * factor;
    const p    = asNumber(per100.protein) * factor;
    const c    = asNumber(per100.carbs) * factor;
    const f    = asNumber(per100.fat) * factor;
    const fi   = asNumber(per100.fiber) * factor;

    return {
      kcal: Math.round(kcal || 0),
      protein_g: Number(p.toFixed(1)),
      carbs_g: Number(c.toFixed(1)),
      fat_g: Number(f.toFixed(1)),
      fiber_g: Number(fi.toFixed(1)),
    };
  }

  const kcal = asNumber(row.kcal);
  const p    = asNumber(row.protein_g);
  const c    = asNumber(row.carbs_g);
  const f    = asNumber(row.fat_g);
  const fi   = asNumber(row.fiber_g);

  return {
    kcal: Math.round(kcal),
    protein_g: Number(p.toFixed(1)),
    carbs_g: Number(c.toFixed(1)),
    fat_g: Number(f.toFixed(1)),
    fiber_g: Number(fi.toFixed(1)),
  };
}

// Calcola i valori totali di un giorno
function computeDayTotals(day: NutritionDay) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0, fiber = 0;
  for (const meal of day.meals) {
    for (const it of meal.items) {
      const v = computeRowMacros(it);
      kcal += v.kcal || 0;
      protein += v.protein_g || 0;
      carbs += v.carbs_g || 0;
      fat += v.fat_g || 0;
      fiber += v.fiber_g || 0;
    }
  }
  return {
    kcal: Math.round(kcal),
    protein: Number(protein.toFixed(1)),
    carbs: Number(carbs.toFixed(1)),
    fat: Number(fat.toFixed(1)),
    fiber: Number(fiber.toFixed(1)),
  };
}

// Prende i valori di un alimento
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

// Allinea posizioni pasti secondo MEAL_POS e ordina
function ensureMealPositions(meals: Meal[]): Meal[] {
  const clone = meals.map(m => ({ ...m, items: m.items.map(it => ({ ...it })) }));
  // assegna posizioni standard per i noti
  for (const m of clone) {
    const std = MEAL_POS[m.name];
    if (std) m.position = std;
  }
  // per eventuali nomi sconosciuti, assegna dopo i noti
  let pos = 6;
  const used = new Set(clone.map(m => m.position));
  for (const m of clone) {
    if (!MEAL_POS[m.name]) {
      while (used.has(pos)) pos++;
      m.position = pos++;
      used.add(m.position);
    }
  }
  // ordina
  clone.sort((a, b) => a.position - b.position);
  return clone;
}

/* ===== COMPONENTE ===== */
export default function NutritionPage() {
  usePageTitle("Scheda nutrizionale");
  const navigate = useNavigate();
  const location = useLocation() as any;
  const editPlan = (location?.state?.editPlan ?? null) as PlanDetailFromState | null;

  const { user, token } = readAuthSnapshot();
  const [userType, setUserType] = useState<"utente" | "professionista" | "admin" | undefined>(undefined);
  const selfCustomerIdFromLogin: number | null = user.customer?.id ?? null;

  const [loadingSelf, setLoadingSelf] = useState(false);
  const [selfData, setSelfData] = useState<UserAnthro>({});
  const [savedOk, setSavedOk] = useState<{ planId: number } | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLElement>(null);

  const [proCustomers, setProCustomers] = useState<CustomerDetail[]>([]);

  // usato per il selettore a livello Giorno
  const [addTarget, setAddTarget] = useState<Record<string, number | string>>({});

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

  // id piano in modifica (se arrivo dal dettaglio)
  const [editingPlanId, setEditingPlanId] = useState<number | null>(editPlan?.id ?? null);

  /* ===== Prefill da "Modifica piano" ===== */
  useEffect(() => {
    if (!editPlan) return;

    const goalMap: Record<string, Goal> = {
      mantenimento: "mantenimento",
      perdita_peso: "perdita_peso",
      aumento_peso: "aumento_peso",
      definizione: "definizione",
      massa: "massa",
      altro: "altro",
    };
    
    // Converte i dati del piano esistente (editPlan) 
    const mappedDays: NutritionDay[] = (editPlan.days || []).map((d) => {
      const meals = (d.meals || []).map((m) => ({
        position: MEAL_POS[m.name] ?? m.position ?? 999,
        name: m.name,
        notes: m.notes || "",
        items: (m.items && m.items.length ? m.items : []).map((it) => ({
          id: (it.food_id ?? (it as any).food_id ?? null) as number | null,
          description: it.label ?? "",
          qty: (it.qty ?? 0) as number,
          unit: ((it.unit as any) || "g") as FoodRow["unit"],
          kcal: it.kcal ?? null,
          protein_g: it.protein_g ?? null,
          carbs_g: it.carbs_g ?? null,
          fat_g: it.fat_g ?? null,
          fiber_g: (it as any).fiber_g ?? null,
          _per100: null,
        })),
      }));
      return { day: d.day, meals: ensureMealPositions(meals) };
    });

    setEditingPlanId(editPlan.id);
    setState((s) => ({
      ...s,
      consentAccepted: true,
      cheatConfirmed: true,
      expire: editPlan.expire ? editPlan.expire.slice(0, 10) : "",
      goal: goalMap[editPlan.goal] ?? "mantenimento",
      days: mappedDays.length ? mappedDays : s.days,
      showPreview: false,
    }));
  }, [editPlan]);

  // ====== SELF ======
  useEffect(() => {
    if (state.ownerMode !== "self") return;

    (async () => {
      try {
        setLoadingSelf(true);
        const me: MeResponse = await api.get("/me");

        const resolvedWeight =
          me.latest_weight ??
          me.customer?.weight ??
          (me.user as any)?.weight ??
          null;

        const resolvedHeight =
          (typeof me.height === "number" ? me.height : null) ??
          me.customer?.height ??
          (me.user as any)?.height ??
          null;

        setSelfData({
          first_name: me.first_name ?? me.user?.first_name ?? undefined,
          last_name:  me.last_name  ?? me.user?.last_name  ?? undefined,
          sex:        (me.sex ?? me.user?.sex ?? undefined) as any,
          dob:        me.dob ?? me.user?.dob ?? undefined,
          weight:     resolvedWeight,
          height:     resolvedHeight,
        });

        setState((s) => ({ ...s, selfCustomerId: me.customer?.id ?? null }));
        setUserType(me.type);
      } catch (e) {
        console.error("Errore /api/me", e);
        setUserType((user?.type as any) ?? undefined);
      } finally {
        setLoadingSelf(false);
      }
    })();
  }, [state.ownerMode, user?.type, token]);

  // ====== LISTA CLIENTI (pro/admin) ======
  useEffect(() => {
    if (!(userType === "professionista" || userType === "admin")) return;
    (async () => {
      try {
        const rows = await api.get<CustomerDetail[]>("/customers");
        setProCustomers(rows);
      } catch (e) {
        console.error("Errore caricamento /customers", e);
      }
    })();
  }, [userType]);

  // ====== SELEZIONE CLIENTE: autopopolazione otherPerson ======
  useEffect(() => {
    if (!(userType === "professionista" || userType === "admin")) return;
    if (!state.targetCustomerId) return;
    const c = proCustomers.find(x => x.customer_id === state.targetCustomerId);
    if (!c) return;

    const age = ageFromDOB(c.dob);
    setState(s => ({
      ...s,
      otherPerson: {
        first_name: c.first_name || "",
        last_name:  c.last_name  || "",
        sex:        (c.sex as any) || "O",
        age:        typeof age === "number" ? age : "",
        weight:     typeof c.latest_weight === "number" ? c.latest_weight : "",
        height:     typeof c.height === "number" ? c.height : "",
      },
    }));
  }, [state.targetCustomerId, userType, proCustomers]);

  // ====== DERIVATI (Calcola quando serve i valori nutrizionali e li tiene memorizzati) ======
  const derived = useMemo(() => {
    const sex = state.ownerMode === "self" ? selfData.sex : state.otherPerson.sex;
    const weight =
      state.ownerMode === "self" ? selfData.weight ?? undefined : (state.otherPerson.weight as number | undefined);
    const height =
      state.ownerMode === "self" ? selfData.height ?? undefined : (state.otherPerson.height as number | undefined);
    const age = state.ownerMode === "self" ? ageFromDOB(selfData.dob) : (state.otherPerson.age as number | undefined);

    const BMR = bmr(sex as any, weight, height, age);
    const TDEE = BMR ? BMR * activityFactor[state.activity] : undefined;
    const target = kcalForGoal(state.goal, TDEE);
    return { BMR: BMR ? Math.round(BMR) : undefined, TDEE: TDEE ? Math.round(TDEE) : undefined, targetKcal: target };
  }, [state.ownerMode, selfData, state.otherPerson, state.activity, state.goal]);

  // ====== dati per la VISTA SAFE da esportare ======
  const cheatsLabel = useMemo(() => {
    return state.cheatDays.length
      ? state.cheatDays.sort((a, b) => a - b).map((d) => weekdayLabel(d)).join(", ")
      : "nessuno";
  }, [state.cheatDays]);

  const editableDays = useMemo(
    () => state.days.filter((d) => !new Set(state.cheatDays).has(d.day)),
    [state.days, state.cheatDays]
  );

  const exportDays: ExportDay[] = useMemo(() => {
    return editableDays.map((d) => {
      const totals = computeDayTotals(d);
      return {
        label: `Giorno ${d.day} — ${weekdayLabel(d.day)}`,
        totals: { kcal: totals.kcal, protein: totals.protein, carbs: totals.carbs, fiber: totals.fiber, fat: totals.fat },
        meals: ensureMealPositions(d.meals).map((m) => ({
          name: m.name,
          items: m.items.map((it) => {
            const v = computeRowMacros(it);
            return { text: `${it.description || "—"} — ${it.qty}${it.unit}${v.kcal ? `, ${v.kcal} kcal` : ""}` };
          }),
        })),
      };
    });
  }, [editableDays]);

  function toMessage(e: unknown, fallback = "Errore sconosciuto") {
    if (e instanceof Error) return e.message;
    if (typeof e === "string") return e;
    if (e && typeof e === "object" && "message" in e && typeof (e as any).message === "string") {
      return (e as any).message;
    }
    try {
      return JSON.stringify(e);
    } catch {
      return fallback;
    }
  }

  // === VISTA MESSAGGIO SALVATAGGIO SCHEDA ===
  if (savedOk) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 text-emerald-700">
            <span className="inline-flex items-center justify-center rounded-full border border-emerald-600 text-emerald-600 h-8 w-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="font-semibold text-lg">
              Hai salvato con successo il tuo piano nutrizionale
            </span>
          </div>

          <p className="text-base">
            <button
              type="button"
              className="underline underline-offset-2 text-emerald-700 hover:no-underline"
              onClick={() => navigate("/schedules")}
            >
              Clicca qui per visualizzare l&apos;elenco dei tuoi piani nutrizionali
            </button>
          </p>

          <div className="pt-2">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              onClick={() => navigate("/schedules")}
            >
              Vai ai miei piani
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 1) POPUP CONSENSO
  if (!state.consentAccepted) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-10 mb-24">
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
            <button className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700" onClick={() => window.history.back()}>
              Annulla
            </button>
            <button className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => setState((s) => ({ ...s, consentAccepted: true }))}>
              Accetto e procedo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2) SELEZIONARE SGARRI
  if (!state.cheatConfirmed) {
    const safeUnique = (arr: number[]) =>
      Array.from(new Set(arr.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))).sort((a, b) => a - b);
    const nonCheatCount = 7 - safeUnique(state.cheatDays).length;

    // Attiva disattiva giorno sgarro
    const toggleDay = (d: number) =>
      setState((s) => {
        const current = safeUnique(s.cheatDays);
        const has = current.includes(d);
        if (has) return { ...s, cheatDays: current.filter((x) => x !== d) };
        if (current.length >= MAX_CHEATS) {
          alert(`Puoi selezionare al massimo ${MAX_CHEATS} sgarri.\nGiorni utili minimi: ${7 - MAX_CHEATS}.`);
          return s;
        }
        return { ...s, cheatDays: safeUnique([...current, d]) };
      });
    
    // Valida e conferma sgarri (massimo 3)  
    const handleConfirmCheats = () => {
      const cheats = safeUnique(state.cheatDays);
      if (cheats.length > MAX_CHEATS) {
        alert(`Hai selezionato troppi sgarri (${cheats.length}). Massimo consentito: ${MAX_CHEATS}.`);
        return;
      }
      const usable = 7 - cheats.length;
      if (usable < 7 - MAX_CHEATS) {
        alert(`Devono restare almeno ${7 - MAX_CHEATS} giorni utili. Hai selezionato ${cheats.length} sgarri.`);
        return;
      }
      setState((s) => ({ ...s, cheatDays: cheats, cheatConfirmed: true }));
    };

    return (
      <div className="w-full max-w-3xl mx-auto mt-10 pb-24">
        <div className="bg-white rounded-2xl shadow p-6 border">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4">Seleziona i giorni di “sgarro”</h2>
          <p className="text-sm text-gray-600 mb-4">
            Puoi scegliere al massimo {MAX_CHEATS} sgarri (giorni utili minimi: {7 - MAX_CHEATS}).<br />
            Giorni utili attuali: <strong>{nonCheatCount}</strong>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => {
              const active = (new Set(state.cheatDays)).has(d);
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

          <div className="mt-6 flex justify-end gap-3">
            <button className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700" onClick={() => window.history.back()}>
              Annulla
            </button>
            <button className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={handleConfirmCheats}>
              Conferma e continua
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Flag: stabilisce quando disabilitare il pulsante Salva in base a ruolo e intestatario
  const disabledSave =
    state.ownerMode === "other" // blocco totale salvataggio per "altra persona"
      ? true
      : userType === "utente"
      ? !(state.ownerMode === "self" && !!state.selfCustomerId)
      : (userType === "professionista" || userType === "admin")
      ? state.ownerMode === "self"
        ? !state.selfCustomerId
        : !state.targetCustomerId
      : true;

  // Handler principale: salva (modifica se esiste, altrimenti crea nuovo)
  const handleSave = async () => {
    // Guardrail: con "altra persona" il salvataggio DB è vietato
    if (state.ownerMode === "other") {
      alert("Con 'Un’altra persona' non è possibile salvare nel DB. Puoi usare Anteprima o esportare in PNG.");
      return;
    }

    // Validazione: serve la data di scadenza
    if (!state.expire) {
      alert("Inserisci la data di scadenza del piano.");
      return;
    }

    // Modalità MODIFICA: aggiorna intestazione e sostituisce giorni/pasti/items
    if (editingPlanId) {
      try {
        // Merge note + nota sgarri
        const mergedNotes = state.notes?.trim()
          ? `${state.notes.trim()}\n\nSgarri: ${state.cheatDays.sort((a, b) => a - b).join(", ") || "nessuno"}.`
          : `Sgarri: ${state.cheatDays.sort((a, b) => a - b).join(", ") || "nessuno"}.`;

        let putOk = false;
        try {
          await api.put(`/nutrition/plans/${editingPlanId}`, {
            expire: state.expire,
            goal: state.goal,
            notes: mergedNotes || null,
          });
          putOk = true;
        } catch (e) {
            const msg = toMessage(e, "Controlla i dati inviati.");
            alert(`❌ Aggiornamento piano rifiutato.\n${msg}`);
            console.warn("PUT piano fallita o non disponibile:", e);
        }

        // Giorni editabili: esclude sgarri e riallinea posizioni pasti
        const editableDaysLocal = state.days
          .filter((d) => !new Set(state.cheatDays).has(d.day))
          .map(d => ({ ...d, meals: ensureMealPositions(d.meals) }));

        // Payload REPLACE: giorni → pasti → items già normalizzati
        const replacePayload = {
          days: editableDaysLocal.map((d) => ({
            day: d.day,
            meals: d.meals.map((m) => ({
              position: m.position,
              name: m.name,
              notes: m.notes ?? null,
              items: m.items.map((it, idx) => {
                const v = computeRowMacros(it);
                return {
                  position: idx + 1,
                  food_id: it.id ?? null,
                  description: it.description || null,
                  qty: it.qty ?? null,
                  unit: it.unit,
                  kcal: v.kcal ?? null,
                  protein_g: v.protein_g ?? null,
                  carbs_g: v.carbs_g ?? null,
                  fat_g: v.fat_g ?? null,
                  fiber_g: v.fiber_g ?? null,
                };
              }),
            })),
          })),
        };

        let repOk = false;
        try {
          await api.post(`/nutrition/plans/${editingPlanId}/replace`, replacePayload);
          repOk = true;
        } catch (e) {
          const msg = toMessage(e, "Controlla i valori di alimenti/quantità/macros.");
          alert(`❌ Aggiornamento contenuti rifiutato.\n${msg}`);
          console.warn("REPLACE giorni/pasti/items fallita:", e);
        }

        if (putOk || repOk) {
          setSavedOk({ planId: editingPlanId });
          setState((s) => ({ ...s, showPreview: false }));
          return;
        }

      } catch (e) {
        // Fallback: se la modifica fallisce, si tenterà la creazione
        console.warn("Modifica piano non disponibile, procedo con creazione nuova.", e);
      }
    }

    // Modalità CREAZIONE: crea piano + giorni + pasti + items
    const effectiveCustomerId =
      userType === "utente"
        ? state.ownerMode === "self"
          ? state.selfCustomerId ?? null
          : null
        : state.ownerMode === "self"
        ? state.selfCustomerId ?? null
        : state.targetCustomerId ?? null;

    // Guardrail: serve un customer_id valido
    if (!effectiveCustomerId) {
      alert(
        (userType === "professionista" || userType === "admin")
          ? "Seleziona un customer_id esistente per salvare nel DB."
          : "Profilo cliente mancante."
      );
      return;
    }

    try {
      // Merge note + nota sgarri
      const mergedNotes = state.notes?.trim()
        ? `${state.notes.trim()}\n\nSgarri: ${state.cheatDays.sort((a, b) => a - b).join(", ") || "nessuno"}.`
        : `Sgarri: ${state.cheatDays.sort((a, b) => a - b).join(", ") || "nessuno"}.`;

      const tkn = token;

      const plan = await api.post<{ id: number }>("/nutrition/plans", {
        customer_id: effectiveCustomerId,
        expire: state.expire,
        goal: state.goal,
        notes: mergedNotes || null,
      });
      const planId = plan.id;

      // Mappa giorno→id (per collegare pasti)
      const dayIdMap: Record<number, number> = {};
      const editableDaysLocal = state.days
        .filter((d) => !new Set(state.cheatDays).has(d.day))
        .map(d => ({ ...d, meals: ensureMealPositions(d.meals) }));

      // Crea giorni (POST /days)
      for (const d of editableDaysLocal) {
        const dj = await api.post<{ id: number }>("/nutrition/days", { plan_id: planId, day: d.day });
        dayIdMap[d.day] = dj.id;
      }

      // Mappa chiave (day-position) → meal_id
      const mealIdMap: Record<string, number> = {};
      for (const d of editableDaysLocal) {
        const day_id = dayIdMap[d.day];
        for (const meal of d.meals) {
          const mj = await api.post<{ id: number }>("/nutrition/meals", {
            day_id,
            position: meal.position,
            name: meal.name,
            notes: meal.notes || null,
          });
          mealIdMap[`${d.day}-${meal.position}`] = mj.id;
        }
      }

      // Payload bulk per items (derivando i macros calcolati)
      const itemsPayload = editableDaysLocal.flatMap((d) =>
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
              fiber_g: v.fiber_g ?? null,
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

      // Esito OK: mostra conferma e chiudi anteprima
      setSavedOk({ planId });
      setState((s) => ({ ...s, showPreview: false }));
    } catch (e) {
      // Errore creazione generale
      console.error(e);
      alert("❌ Errore salvataggio piano.");
    }
  };

  // PREVIEW: schermata di anteprima/esportazione e salvataggio
  if (state.showPreview) {
    return (
      <div className="w-full max-w-5xl mx-auto mt-8 md:pt-24">
        <div ref={previewRef} data-export-onecol style={{ background: "#ffffff" }} className="rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4">Anteprima piano nutrizionale</h2>

          {/* Riepilogo metadati e calcoli */}
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

          {/* Elenco giorni (solo non-sgarro) con pasti e alimenti */}
          <div className="grid md:grid-cols-2 gap-6" data-export-onecol>
            {editableDays.map((d) => {
              const totals = computeDayTotals(d);
              return (
                <div key={d.day} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold">
                      Giorno {d.day} — {weekdayLabel(d.day)} • {totals.kcal} kcal
                    </h4>
                  </div>
                  <div className="text-xs text-gray-600 mb-3">
                    <span className="mr-4"><strong>Kcal</strong>: {totals.kcal}</span>
                    <span className="mr-4"><strong>Prot</strong>: {totals.protein} g</span>
                    <span className="mr-4"><strong>Carb</strong>: {totals.carbs} g</span>
                    <span className="mr-4"><strong>Fibre</strong>: {totals.fiber} g</span>
                    <span className="mr-4"><strong>Grassi</strong>: {totals.fat} g</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {ensureMealPositions(d.meals).map((m) => (
                      <div key={`prev-${d.day}-${m.position}`}>
                        <div className="font-semibold">{m.name}</div>
                        {m.items.length ? (
                          <ul className="list-disc ml-5">
                            {m.items.map((it, idx) => {
                              const v = computeRowMacros(it);
                              return (
                                <li key={`prev-${d.day}-${m.position}-row-${idx}`}>
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
              );
            })}
          </div>
        </div>

        {/* Azioni anteprima: torna, esporta, salva */}
        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button
            className="px-5 py-3 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            onClick={() => setState((s) => ({ ...s, showPreview: false }))}
          >
            Torna alla modifica
          </button>

          <Html2CanvasExportButton
            getTarget={() => exportRef.current}
            filename="piano-nutrizionale.png"
            scale={2}
            label="Esporta PNG"
          />

          <button
            className={`px-5 py-3 rounded-xl ${
              editingPlanId
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : (disabledSave ? "bg-gray-300 text-white" : "bg-emerald-600 text-white hover:bg-emerald-700")
            }`}
            disabled={!editingPlanId && disabledSave}
            onClick={handleSave}
          >
            {editingPlanId ? "Salva modifiche" : "Salva nel DB"}
          </button>
        </div>

        {/* Componente offscreen per export PNG */}
        <ExportNutritionPreview
          ref={exportRef}
          offscreen
          meta={{
            expire: state.expire || "—",
            goal: state.goal,
            activity: state.activity,
            bmr: derived.BMR,
            tdee: derived.TDEE,
            target: derived.targetKcal,
            cheats: cheatsLabel,
          }}
          days={exportDays}
        />
      </div>
    );
  }

  // EDITOR: schermata principale di compilazione e azioni di fondo
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* intestazione/owner */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6 mt-10">
        <div className="flex items-start gap-3 justify-between">
          <h2 className="text-2xl font-bold text-indigo-700">
            {editingPlanId ? `Modifica piano #${editingPlanId}` : "Crea piano nutrizionale"}
          </h2>

          {/* azioni in alto */}
          <div className="flex gap-2">
            {!editingPlanId && (
              <button
                className="px-3 py-2 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm"
                onClick={() => setState((s) => ({ ...s, cheatConfirmed: false }))}
              >
                Modifica sgarri
              </button>
            )}

            <button
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
              onClick={() => setState((s) => ({ ...s, showPreview: true }))}
            >
              Anteprima
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end mt-4">
          {/* owner switch */}
          <div className="flex items-center gap-3">
            <label className="font-semibold text-indigo-700">Intestatario:</label>
            <label className="flex items-center gap-2 opacity-80">
              <input
                type="radio"
                checked={state.ownerMode === "self"}
                onChange={() => setState((s) => ({ ...s, ownerMode: "self" }))}
                disabled={!!editingPlanId}
              />
              <span>Me stesso</span>
            </label>
            <label className="flex items-center gap-2 opacity-80">
              <input
                type="radio"
                checked={state.ownerMode === "other"}
                onChange={() => setState((s) => ({ ...s, ownerMode: "other" }))}
                disabled={!!editingPlanId}
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
          /* === ALTRA PERSONA === */
          <div className="mt-4">
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800 text-sm mb-4">
              Hai selezionato <strong>Un’altra persona</strong>: il salvataggio su DB è disabilitato. Puoi comunque
              generare l’Anteprima ed esportare il PNG.
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-indigo-700 mb-1">Nome</label>
                <input
                  className="p-2 rounded-md border border-indigo-200 bg-white w-full"
                  value={state.otherPerson.first_name}
                  onChange={(e) => setState(s => ({ ...s, otherPerson: { ...s.otherPerson, first_name: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm text-indigo-700 mb-1">Cognome</label>
                <input
                  className="p-2 rounded-md border border-indigo-200 bg-white w-full"
                  value={state.otherPerson.last_name}
                  onChange={(e) => setState(s => ({ ...s, otherPerson: { ...s.otherPerson, last_name: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm text-indigo-700 mb-1">Sesso</label>
                <select
                  className="p-2 rounded-md border border-indigo-200 bg-white w-full"
                  value={state.otherPerson.sex}
                  onChange={(e) =>
                    setState(s => ({ ...s, otherPerson: { ...s.otherPerson, sex: e.target.value as "M"|"F"|"O" } }))
                  }
                >
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="O">Altro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-indigo-700 mb-1">Età</label>
                <input
                  type="number"
                  min={0}
                  className="p-2 rounded-md border border-indigo-200 bg-white w-full"
                  value={state.otherPerson.age}
                  onChange={(e) =>
                    setState(s => ({
                      ...s,
                      otherPerson: { ...s.otherPerson, age: e.target.value === "" ? "" : Number(e.target.value) },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-indigo-700 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  className="p-2 rounded-md border border-indigo-200 bg-white w-full"
                  value={state.otherPerson.weight}
                  onChange={(e) =>
                    setState(s => ({
                      ...s,
                      otherPerson: { ...s.otherPerson, weight: e.target.value === "" ? "" : Number(e.target.value) },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-indigo-700 mb-1">Altezza (cm)</label>
                <input
                  type="number"
                  min={0}
                  className="p-2 rounded-md border border-indigo-200 bg-white w-full"
                  value={state.otherPerson.height}
                  onChange={(e) =>
                    setState(s => ({
                      ...s,
                      otherPerson: { ...s.otherPerson, height: e.target.value === "" ? "" : Number(e.target.value) },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDITOR SETTIMANA */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-bold text-indigo-700 mb-4">Pianifica i tuoi pasti con semplicità!</h3>

        {editableDays.length === 0 ? (
          <div className="text-sm text-gray-600">
            Hai selezionato tutti i giorni come sgarro. Torna su <em>Modifica sgarri</em> per liberarne almeno uno. 🙂</div>
        ) : (
          <div className="space-y-8">
            {editableDays.map((d) => {
              const totals = computeDayTotals(d);
              const mealsOrdered = ensureMealPositions(d.meals);

              return (
                <div key={d.day} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/40">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-indigo-700">
                      Giorno {d.day} — {weekdayLabel(d.day)} • {totals.kcal} kcal
                    </h4>
                  </div>

                  <div className="text-xs text-gray-600 mb-3">
                    <span className="mr-4"><strong>Kcal</strong>: {totals.kcal}</span>
                    <span className="mr-4"><strong>Prot</strong>: {totals.protein}</span>
                    <span className="mr-4"><strong>Carb</strong>: {totals.carbs}</span>
                    <span className="mr-4"><strong>Fibre</strong>: {totals.fiber}</span>
                    <span className="mr-4"><strong>Grassi</strong>: {totals.fat}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-indigo-100 rounded-xl overflow-hidden">
                      <thead className="bg-indigo-50">
                        <tr>
                          <th className="p-2 text-left w-10"> </th>
                          <th className="p-2 text-left">Pasto</th>
                          <th className="p-2 text-left">Alimento / descrizione</th>
                          <th className="p-2 text-left w-[88px]">Qty</th>
                          <th className="p-2 text-left w-[88px]">Unità</th>
                          <th className="p-2 text-left">kcal</th>
                          <th className="p-2 text-left">Prot</th>
                          <th className="p-2 text-left">Carb</th>
                          <th className="p-2 text-left">Fibre</th>
                          <th className="p-2 text-left">Grassi</th>
                        </tr>
                      </thead>

                      <tbody>
                        {mealsOrdered.map((meal, mIdx) => {
                          if (!meal.items || meal.items.length === 0) return null;

                          const mealTotals = meal.items.reduce(
                            (acc, it) => {
                              const v = computeRowMacros(it);
                              acc.kcal += v.kcal || 0;
                              acc.protein += v.protein_g || 0;
                              acc.carbs += v.carbs_g || 0;
                              acc.fiber += v.fiber_g || 0;
                              acc.fat += v.fat_g || 0;
                              return acc;
                            },
                            { kcal: 0, protein: 0, carbs: 0, fiber: 0, fat: 0 }
                          );

                          return (
                            <Fragment key={`meal-${d.day}-${meal.position}`}>
                              {meal.items.map((row, iIdx) => {
                                const values = computeRowMacros(row);
                                const isFirst = iIdx === 0;

                                return (
                                  <tr
                                    key={`day-${d.day}-meal-${meal.position}-row-${iIdx}`}
                                    className={`${isFirst ? "border-t" : "border-t-0"} align-top`}
                                  >
                                    <td className="p-2">
                                      <button
                                        type="button"
                                        className="h-8 w-8 rounded-full border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition flex items-center justify-center"
                                        onClick={() =>
                                          setState((s) => {
                                            const next = structuredClone(s);
                                            const dayIndex = next.days.findIndex((x) => x.day === d.day);
                                            const meals = ensureMealPositions(next.days[dayIndex].meals);
                                            meals[mIdx].items.splice(iIdx, 1);
                                            next.days[dayIndex].meals = meals;
                                            return next;
                                          })
                                        }
                                        title="Elimina riga"
                                        aria-label="Elimina riga"
                                      >
                                        <span className="text-lg leading-none">–</span>
                                      </button>
                                    </td>

                                    <td className="p-2 w-40">
                                      <select
                                        className="w-full border rounded p-2 text-sm"
                                        value={meal.position}
                                        onChange={(e) =>
                                          setState((s) => {
                                            const toPos = Number(e.target.value);
                                            const next = structuredClone(s);
                                            const dayIndex = next.days.findIndex((x) => x.day === d.day);
                                            const meals = ensureMealPositions(next.days[dayIndex].meals);

                                            // sposta la riga nel pasto con quella position
                                            const moved = meals[mIdx].items.splice(iIdx, 1)[0];
                                            const toMealIdx = meals.findIndex((mm) => mm.position === toPos);
                                            if (toMealIdx >= 0) meals[toMealIdx].items.push(moved);

                                            next.days[dayIndex].meals = ensureMealPositions(meals);
                                            return next;
                                          })
                                        }
                                      >
                                        {mealsOrdered.map((opt) => (
                                          <option key={opt.position} value={opt.position}>
                                            {opt.name}
                                          </option>
                                        ))}
                                      </select>
                                    </td>

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
                                              target.unit = food.default_unit as any;
                                            } else {
                                              target.id = null;
                                              target._per100 = null;
                                            }
                                            return next;
                                          });
                                        }}
                                        placeholder={row.description ? row.description : "Cerca alimento…"}
                                      />
                                    </td>

                                    <td className="p-2 w-[88px]">
                                      <input
                                        type="number"
                                        className="w-full border rounded p-2 text-right"
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

                                    <td className="p-2 w-[88px]">
                                      <select
                                        className="w-full border rounded p-2"
                                        value={row.unit}
                                        onChange={(e) =>
                                          setState((s) => {
                                            const next = structuredClone(s);
                                            const dayIndex = next.days.findIndex((x) => x.day === d.day);
                                            next.days[dayIndex].meals[mIdx].items[iIdx].unit =
                                              e.target.value as FoodRow["unit"];
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

                                    <td className="p-2 align-middle">{values.kcal || 0}</td>
                                    <td className="p-2 align-middle">{values.protein_g || 0}</td>
                                    <td className="p-2 align-middle">{values.carbs_g || 0}</td>
                                    <td className="p-2 align-middle">{values.fiber_g || 0}</td>
                                    <td className="p-2 align-middle">{values.fat_g || 0}</td>
                                  </tr>
                                );
                              })}

                              {/* Aggiungi ALIMENTO sotto il pasto (prima dei totali) */}
                              <tr className="border-t-0" key={`add-food-${d.day}-${meal.position}`}>
                                <td className="p-2" />
                                <td className="p-2" colSpan={8}>
                                  <button
                                    type="button"
                                    className="px-3 py-1.5 rounded-lg border border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm"
                                    onClick={() =>
                                      setState((s) => {
                                        const next = structuredClone(s);
                                        const dayIndex = next.days.findIndex((x) => x.day === d.day);
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
                                        return next;
                                      })
                                    }
                                  >
                                    + Aggiungi alimento
                                  </button>
                                </td>
                              </tr>

                              {/* Totali pasto */}
                              <tr className="bg-indigo-50 border-t" key={`tot-${d.day}-${meal.position}`}>
                                <td className="p-2" />
                                <td className="p-2 font-semibold text-indigo-700">Totale {meal.name}</td>
                                <td className="p-2" />
                                <td className="p-2" />
                                <td className="p-2" />
                                <td className="p-2 font-medium">{mealTotals.kcal}</td>
                                <td className="p-2 font-medium">{mealTotals.protein.toFixed(1)}</td>
                                <td className="p-2 font-medium">{mealTotals.carbs.toFixed(1)}</td>
                                <td className="p-2 font-medium">{mealTotals.fiber.toFixed(1)}</td>
                                <td className="p-2 font-medium">{mealTotals.fat.toFixed(1)}</td>
                              </tr>
                            </Fragment>
                          );
                        })}

                        {/* Selettore UNICO a fine GIORNO: Aggiungi PASTO (o riga alimento se già esiste) */}
                        <tr className="border-t-0">
                          <td className="p-2" />
                          <td className="p-2" colSpan={8}>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm text-gray-700">Aggiungi pasto:</span>
                              <select
                                className="border rounded p-2 text-sm"
                                value={(addTarget[`${d.day}-MEALNAME`] as string) ?? MEAL_TYPES[0]}
                                onChange={(e) =>
                                  setAddTarget((prev) => ({
                                    ...prev,
                                    [`${d.day}-MEALNAME`]: e.target.value,
                                  }))
                                }
                              >
                                {MEAL_TYPES.map((name) => (
                                  <option key={name} value={name}>
                                    {name}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-lg border border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm"
                                onClick={() =>
                                  setState((s) => {
                                    const next = structuredClone(s);
                                    const dayIndex = next.days.findIndex((x) => x.day === d.day);
                                    const mealsArr = ensureMealPositions(next.days[dayIndex].meals);

                                    const name =
                                      (addTarget[`${d.day}-MEALNAME`] as string) ?? MEAL_TYPES[0];

                                    const idx = mealsArr.findIndex(
                                      (m) => (m.name || "").toLowerCase() === name.toLowerCase()
                                    );

                                    if (idx >= 0 && mealsArr[idx].items.length >= 1) {
                                      mealsArr[idx].items.push({
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
                                    } else {
                                      mealsArr.push({
                                        position: MEAL_POS[name] ?? 999,
                                        name,
                                        notes: "",
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
                                      });
                                    }
                                    next.days[dayIndex].meals = ensureMealPositions(mealsArr);
                                    return next;
                                  })
                                }
                              >
                                + Aggiungi pasto
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pulsante ANTEPRIMA alla fine */}
        <div className="mt-6 flex justify-end">
          <button
            className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => setState((s) => ({ ...s, showPreview: true }))}
          >
            Anteprima
          </button>
        </div>
      </div>

      {/* Footer azioni complessive */}
      <div className="mt-6 flex justify-end gap-3">
        <Html2CanvasExportButton
          getTarget={() => exportRef.current}
          filename="piano-nutrizionale.png"
          scale={2}
          label="Esporta PNG"
        />
        <button
          className={`px-5 py-3 rounded-xl ${
            editingPlanId
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : (disabledSave ? "bg-gray-300 text-white cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700")
          }`}
          disabled={!editingPlanId && disabledSave}
          onClick={handleSave}
        >
          {state.ownerMode === "other"
            ? "Salvataggio disabilitato (altra persona)"
            : (editingPlanId ? "Salva modifiche" : "Salva nel DB")}
        </button>
      </div>
    </div>
  );
}
