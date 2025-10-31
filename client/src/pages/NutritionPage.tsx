import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import FoodAsyncSelect from "../components/FoodAsyncSelect";
import Html2CanvasExportButton from "../components/Html2CanvasExportButton";
import ExportNutritionPreview, { type ExportDay } from "../export/ExportNutritionPreview";

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
  dob?: string;
  weight?: number | null;
  height?: number | null;
};

type FoodRow = {
  id?: number | null;
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

const MAX_CHEATS = 3;

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

function computeRowMacros(
  row: FoodRow
): Required<Pick<FoodRow, "kcal" | "protein_g" | "carbs_g" | "fat_g" | "fiber_g">> {
  const per100 = row._per100 ?? null;
  let factor = 0;

  if (per100) {
    if (row.unit === "g" || row.unit === "ml") factor = (row.qty || 0) / 100;
    else factor = row.qty || 0;

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

  return {
    kcal: Math.round(row.kcal || 0),
    protein_g: Number((row.protein_g || 0).toFixed(1)),
    carbs_g: Number((row.carbs_g || 0).toFixed(1)),
    fat_g: Number((row.fat_g || 0).toFixed(1)),
    fiber_g: Number((row.fiber_g || 0).toFixed(1)),
  };
}

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
  const navigate = useNavigate();

  const { user, token } = readAuthSnapshot();
  const [userType, setUserType] = useState<"utente" | "professionista" | "admin" | undefined>(undefined);
  const selfCustomerIdFromLogin: number | null = user.customer?.id ?? null;

  const [loadingSelf, setLoadingSelf] = useState(false);
  const [selfData, setSelfData] = useState<UserAnthro>({});
  const [savedOk, setSavedOk] = useState<{ planId: number } | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  // 👇 ref per la VISTA SAFE da “fotografare”
  const exportRef = useRef<HTMLElement>(null);

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

  const exportDays: ExportDay[] = useMemo(() => {
    return state.days
      .filter((d) => !new Set(state.cheatDays).has(d.day))
      .map((d) => {
        const totals = computeDayTotals(d);
        return {
          label: `Giorno ${d.day} — ${weekdayLabel(d.day)}`,
          totals: { kcal: totals.kcal, protein: totals.protein, carbs: totals.carbs, fiber: totals.fiber, fat: totals.fat },
          meals: d.meals.map((m) => ({
            name: m.name,
            items: m.items.map((it) => {
              const v = computeRowMacros(it);
              return { text: `${it.description || "—"} — ${it.qty}${it.unit}${v.kcal ? `, ${v.kcal} kcal` : ""}` };
            }),
          })),
        };
      });
  }, [state.days, state.cheatDays]);
  
  // === VISTA SOLO-MESSAGGIO (centrata) ===
  if (savedOk) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 text-emerald-700">
            {/* spunta verde cerchiata */}
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
              onClick={() => navigate("/nutrition/plans")} // cambia la rotta se serve
            >
              Clicca qui per visualizzare l&apos;elenco dei tuoi piani nutrizionali
            </button>
          </p>

          <div className="pt-2">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              onClick={() => navigate("/nutrition/plans")} // cambia la rotta se serve
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
      <div className="w-full max-w-3xl mx-auto mt-10">
        <div className="bg-white rounded-2xl shadow p-6 border">
          <h2 className="text-2xl font-bold text-indigo-700 mb-3">Informativa & consenso</h2>
          <div className="text-sm text-gray-700 space-y-3">
            <p>
              Questo generatore di piano nutrizionale ha finalità informative ed educative. Non sostituisce il parere di un
              medico o di un professionista sanitario. In presenza di condizioni cliniche, gravidanza, allattamento o terapie
              farmacologiche, consulta il tuo medico prima di adottare qualunque piano alimentare.
              medico o di un professionista sanitario.
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

  // 2) SGARRI
  if (!state.cheatConfirmed) {
    const safeUnique = (arr: number[]) =>
      Array.from(new Set(arr.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))).sort((a, b) => a - b);

    const nonCheatCount = 7 - safeUnique(state.cheatDays).length;

    const toggleDay = (d: number) =>
      setState((s) => {
        const current = safeUnique(s.cheatDays);
        const has = current.includes(d);
        if (has) return { ...s, cheatDays: current.filter((x) => x !== d) };
        if (current.length >= MAX_CHEATS) {
          alert(`Puoi selezionare al massimo ${MAX_CHEATS} giorni di sgarro.\nGiorni utili minimi: ${7 - MAX_CHEATS}.`);
          return s;
        }
        return { ...s, cheatDays: safeUnique([...current, d]) };
      });

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
      <div className="w-full max-w-3xl mx-auto mt-10">
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

  /* ====== EDITOR + PREVIEW ====== */
  const editableDays = state.days.filter((d) => !new Set(state.cheatDays).has(d.day));

  const disabledSave =
    userType === "utente"
      ? !(state.ownerMode === "self" && !!state.selfCustomerId)
      : (userType === "professionista" || userType === "admin")
      ? state.ownerMode === "self"
        ? !state.selfCustomerId
        : !state.targetCustomerId
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

      // 4) items
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
      setSavedOk({ planId });
      setState((s) => ({ ...s, showPreview: false }));
    } catch (e) {
      console.error(e);
      alert("❌ Errore salvataggio piano.");
    }
  };

  // PREVIEW con ref esportabile
  if (state.showPreview) {
    return (
      <div className="w-full max-w-5xl mx-auto mt-8">
        {/* 👇 TUTTO ciò che vuoi nel PDF sta dentro questo wrapper */}
        <div ref={previewRef} data-export-onecol style={{ background: "#ffffff" }} className="rounded-2xl shadow p-6">
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

          {/* Griglia giorni — durante l’export la forziamo a una colonna */}
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
                    {d.meals.map((m) => (
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

        {/* Bottoni FUORI dal ref (non finiscono nel PDF) */}
        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button
            className="px-5 py-3 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            onClick={() => setState((s) => ({ ...s, showPreview: false }))}
          >
            Torna alla modifica
          </button>

          {/* 👇 Export PNG “safe html2canvas” */}
          <Html2CanvasExportButton
            getTarget={() => exportRef.current}
            filename="piano-nutrizionale.png"
            scale={2}
            label="Esporta PNG (compatibile)"
          />

          {/* Salva nel DB */}
          <button
            className={`px-5 py-3 rounded-xl ${
              disabledSave ? "bg-gray-300 text-white" : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
            disabled={disabledSave}
            onClick={handleSave}
          >
            Salva nel DB
          </button>
        </div>

        {/* 👇 MONTIAMO la vista SAFE off-screen (catturata da html2canvas) */}
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

  // ===== EDITOR (resta uguale al tuo) =====
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
              Sgarri: <strong>
                {state.cheatDays.length
                  ? state.cheatDays.sort((a, b) => a - b).map((d) => weekdayLabel(d)).join(", ")
                  : "nessuno"}
              </strong>
            </div>
          </div>
        </div>
      </div>
      
      {/* Messaggio di successo, senza sfondo/riquadro */}
      {savedOk && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-emerald-700">
            {/* spunta verde cerchiata */}
            <span className="inline-flex items-center justify-center rounded-full border border-emerald-600 text-emerald-600 h-6 w-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>

            <span className="font-semibold">
              Hai salvato con successo il tuo piano nutrizionale,
            </span>
            <button
              type="button"
              className="underline underline-offset-2 hover:no-underline"
              onClick={() => navigate("/nutrition/plans")} // cambia path se serve
            >
              clicca qui per visualizzare l&apos;elenco dei tuoi piani nutrizionali
            </button>
          </div>

          <div className="mt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              onClick={() => navigate("/nutrition/plans")} // cambia path se serve
            >
              Vai ai miei piani
            </button>
          </div>
        </div>
      )}

      {/* EDITOR SETTIMANA */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-bold text-indigo-700 mb-4">Settimana (giorni senza sgarro)</h3>

        {editableDays.length === 0 ? (
          <div className="text-sm text-gray-600">
            Hai selezionato tutti i giorni come sgarro. Torna su <em>Modifica sgarri</em> per liberarne almeno uno. 🙂</div>
        ) : (
          <div className="space-y-8">
            {editableDays.map((d) => {
              const totals = computeDayTotals(d);
              return (
                <div key={d.day} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/40">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-indigo-700">
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
                        {d.meals.map((meal, mIdx) => {
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
                                            next.days[dayIndex].meals[mIdx].items.splice(iIdx, 1);
                                            return next;
                                          })
                                        }
                                        title="Elimina riga"
                                        aria-label="Elimina riga"
                                      >
                                        <span className="text-lg leading-none">–</span>
                                      </button>
                                    </td>

                                    <td className="p-2 w-[160px]">
                                      <select
                                        className="w-full border rounded p-2 text-sm"
                                        value={meal.position}
                                        onChange={(e) =>
                                          setState((s) => {
                                            const next = structuredClone(s);
                                            const dayIndex = next.days.findIndex((x) => x.day === d.day);
                                            const fromMealIdx = mIdx;
                                            const toPos = Number(e.target.value);
                                            const moved = next.days[dayIndex].meals[fromMealIdx].items.splice(iIdx, 1)[0];
                                            const toMealIdx = next.days[dayIndex].meals.findIndex((mm) => mm.position === toPos);
                                            if (toMealIdx >= 0) next.days[dayIndex].meals[toMealIdx].items.push(moved);
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
                                              target.unit = food.default_unit;
                                            } else {
                                              target.id = null;
                                              target._per100 = null;
                                            }
                                            return next;
                                          });
                                        }}
                                        placeholder="Cerca alimento…"
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

                              <tr className="border-t-0" key={`add-${d.day}-${meal.position}`}>
                                <td className="p-2" />
                                <td className="p-2" />
                                <td className="p-2" colSpan={3}>
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
                                    + Aggiungi alimento a “{meal.name}”
                                  </button>
                                </td>
                                <td className="p-2" />
                                <td className="p-2" />
                                <td className="p-2" />
                                <td className="p-2" />
                              </tr>

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
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
