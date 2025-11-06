import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, PlusCircle, Trash2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import logoUrl from "../assets/IconaMyFitnobackground.png";

import Html2CanvasExportButton from "../components/Html2CanvasExportButton";
import ExportWorkoutPreview, { type ExportWorkoutDay } from "../export/ExportWorkoutPreview";

/* =========================
   Tipi
   ========================= */
type Esercizio = {
  exerciseId?: number; // ID esercizio selezionato
  nome: string;
  serie: string;
  ripetizioni: string;
  recupero: string; // secondi (stringa editabile)
  peso?: string;    // kg (stringa editabile)
  note?: string;    // se undefined => campo note nascosto
};

type GiornoAllenamento = {
  giorno: number;
  gruppi: string[];
  esercizi: Esercizio[];
  gruppiConfermati: boolean;
};

type DBExercise = {
  id: number;
  name: string;               // title DB
  musclegroups_id: number;
  groupLabel: string;         // es. "Braccia"
  weightRequired: boolean;    // weight_required === 'y'
  defaultSerie?: string;
  defaultRipetizioni?: string;
  defaultRecupero?: string;
};

type Goal = "peso_costante" | "perdita_peso" | "aumento_peso" | "altro";

function isGoal(v: unknown): v is Goal {
  return v === "peso_costante" || v === "perdita_peso" || v === "aumento_peso" || v === "altro";
}

/* =========================
   ADD: Tipi intestatario + helper auth/eta
   ========================= */
type OwnerMode = "self" | "other";

type UserAnthro = {
  first_name?: string;
  last_name?: string;
  sex?: "M" | "F" | "O";
  dob?: string; // YYYY-MM-DD
  weight?: number | null;
  height?: number | null;
};

type AuthUser = {
  id: number | null;
  username: string | null;
  type: "utente" | "professionista" | null;
  sex: "M" | "F" | "O" | null;
  dob: string | null;
  first_name: string | null;
  last_name: string | null;
  customer: null | {
    id?: number;
    weight?: number | null;
    height?: number | null;
  };
  professional?: any | null;
  prof?: any | null;
  freelancer?: any | null;
  freelancer_id?: number | null;
};

function readAuthSnapshot(): { token: string | null; user: AuthUser } {
  try {
    const raw = JSON.parse(localStorage.getItem("authData") || "{}");
    const u = raw?.user ?? {};
    return {
      token: raw?.token ?? null,
      user: {
        id: u.id ?? raw?.userId ?? null,
        username: u.username ?? raw?.username ?? null,
        type: (u.type ?? raw?.role ?? null) as any, // "utente" | "professionista" | null
        sex: (u.sex ?? null) as any,
        dob: (u.dob ?? null) as any,
        first_name: u.first_name ?? u.firstName ?? null,
        last_name: u.last_name ?? u.lastName ?? null,
        customer: u.customer ?? null,
        // possibili posizioni del freelancer nella tua auth
        professional: u.professional ?? null,
        prof: u.prof ?? null,
        freelancer: u.freelancer ?? null,
        freelancer_id: (u.freelancer_id ?? raw?.freelancer_id ?? null) as any,
      },
    };
  } catch {
    return { token: null, user: {
      id: null, username: null, type: null, sex: null, dob: null,
      first_name: null, last_name: null, customer: null,
      professional: null, prof: null, freelancer: null, freelancer_id: null
    }};
  }
}

function getIsProfessional(user: AuthUser | undefined | null): boolean {
  if (!user) return false;
  if (user.type === "professionista") return true;
  if (user.freelancer_id) return true;
  if (user.freelancer && typeof user.freelancer === "object") return true;
  if (user.professional && typeof user.professional === "object") return true;
  if (user.prof && typeof user.prof === "object") return true;
  return false;
}

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

function getProfessionalDisplay(): string | undefined {
  try {
    const raw = JSON.parse(localStorage.getItem("authData") || "{}");
    const u = raw?.user || {};
    if (u?.type !== "professionista") return undefined;

    const first = (u.first_name || u.firstName || "").trim();
    const last  = (u.last_name  || u.lastName  || "").trim();
    const nick  = (u.username || "").trim();

    const full = [first, last].filter(Boolean).join(" ").trim();

    if (full && nick) return `${full} (${nick})`;
    if (full) return full;
    if (nick) return nick;
  } catch {}
  return undefined;
}

function pickFirst<T = any>(...vals: any[]): T | null {
  for (const v of vals) if (v != null) return v as T;
  return null;
}

function normalizeProfessionalFromMePayload(me: any) {
  // supporta /api/me che restituisce i campi sia top-level sia sotto user
  const u = me?.user ?? {};
  const professional =
    pickFirst(
      me?.professional,
      me?.prof,
      me?.freelancer,                 // a volte il profilo è chiamato "freelancer"
      u?.professional,
      u?.prof,
      u?.freelancer
    ) || null;

  const freelancer_id =
    pickFirst(
      me?.freelancer_id,
      u?.freelancer_id,
      professional?.id
    ) ?? null;

  const display_name =
    pickFirst(
      professional?.display_name,
      professional?.name,
      [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() || null,
      u?.username
    ) ?? null;

  return {
    professional: professional || (display_name ? { display_name } : null),
    freelancer: professional || null,
    freelancer_id: freelancer_id ? Number(freelancer_id) : null,
  };
}

/** Ritorna il customer_id risolto in base allo stato corrente */
function getResolvedCustomerId(
  user: AuthUser | null | undefined,
  ownerMode: OwnerMode,
  isProfessional: boolean,
  otherOwnerMode: "existing" | "manual",
  selectedCustomerId: string
): number | null {
  if (ownerMode === "self") {
    const cid = Number(user?.customer?.id ?? NaN);
    return Number.isFinite(cid) ? cid : null;
  }
  // ownerMode === "other"
  if (isProfessional && otherOwnerMode === "existing") {
    const cid = Number(selectedCustomerId);
    return Number.isFinite(cid) ? cid : null;
  }
  // inserimento manuale o non pro: non abbiamo un customer DB
  return null;
}

/* =========================
   Mappe gruppi
   ========================= */
const GROUP_NAME_TO_ID: Record<string, number> = {
  Spalle: 1,
  Dorso: 2,
  Gambe: 3,
  Petto: 4,
  Braccia: 5,
  Addome: 6,
};
const ID_TO_GROUP_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(GROUP_NAME_TO_ID).map(([k, v]) => [v, k])
) as Record<number, string>;

/* =========================
   Clienti (per tendina professionista)
   ========================= */
type CustomerDetail = {
  customer_id: number;
  user_id?: number | null;
  username?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  sex?: "M" | "F" | "O" | null;
  dob?: string | null;
  height?: number | null;
  latest_weight?: number | null;
};

function formatCustomerLabel(c: CustomerDetail): string {
  const first = (c.first_name ?? "").trim();
  const last  = (c.last_name ?? "").trim();
  const nick  = (c.username ?? "").trim();
  const namePart =
    (first || last)
      ? [first, last].filter(Boolean).join(" ")
      : (nick || c.email || `ID ${c.customer_id}`);
  return nick && namePart !== nick
    ? `${namePart} (${nick})`
    : namePart;
}

/* =========================
   Combo Box cercabile (SOLO INPUT)
   ========================= */
type ExerciseSelectProps = {
  valueId?: number;
  valueName?: string;
  onChange: (opt: DBExercise) => void;
  options: DBExercise[];
  groupsOrder: number[];
  placeholder?: string;
};

// Max di ripetizioni/sets/weight/rest
const toNum = (v: string) => (v === "" || v == null ? NaN : Number(v));

function ExerciseSelect({
  valueId,
  valueName,
  onChange,
  options,
  groupsOrder,
  placeholder = "Seleziona esercizio",
}: ExerciseSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;

  const grouped = groupsOrder
    .map((gid) => ({
      gid,
      label: ID_TO_GROUP_NAME[gid] ?? `Gruppo ${gid}`,
      items: filtered.filter((o) => o.musclegroups_id === gid),
    }))
    .filter((g) => g.items.length > 0);

  const flatList = grouped.flatMap((g) => g.items);
  const safeActiveIdx = Math.min(Math.max(activeIdx, -1), flatList.length - 1);

  const selectByIdx = (idx: number) => {
    if (idx < 0 || idx >= flatList.length) return;
    onChange(flatList[idx]);
    setQuery("");
    setOpen(false);
    setActiveIdx(-1);
  };

  const displayText = valueId
    ? options.find((o) => o.id === valueId)?.name || valueName || ""
    : valueName || "";

  return (
    <div ref={wrapRef} className="relative">
      <input
        className="w-56 sm:w-60 p-2 rounded-md border border-indigo-200 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
        value={open ? query : displayText}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
          setActiveIdx(-1);
        }}
        onFocus={() => setOpen(true)}
        placeholder={displayText || placeholder}
        onKeyDown={(e) => {
          if (!open && (e.key.length === 1 || e.key === "Backspace")) setOpen(true);
          if (!flatList.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((prev) => Math.min((prev < 0 ? -1 : prev) + 1, flatList.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((prev) => Math.max(prev - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (safeActiveIdx >= 0) selectByIdx(safeActiveIdx);
            else if (flatList.length === 1) selectByIdx(0);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />

      {open && (
        <div className="absolute z-30 mt-1 w-56 max-h-64 overflow-auto bg-white text-gray-800 border border-indigo-200 rounded-md shadow dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
          {grouped.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Nessun risultato</div>
          ) : (
            grouped.map((g) => (
              <div key={g.gid} className="py-1">
                <div className="px-3 py-1 text-xs font-semibold text-indigo-600 sticky top-0 bg-white/95 dark:bg-gray-900/95 dark:text-indigo-300">
                  {g.label}
                </div>
                {g.items.map((opt) => {
                  const idx = flatList.findIndex((x) => x.id === opt.id);
                  const active = idx === safeActiveIdx;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-gray-800 ${active ? "bg-indigo-50 dark:bg-gray-800" : ""}`}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => selectByIdx(idx)}
                    >
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* =========================
   Helper per inferire gruppi da esercizi esistenti
   ========================= */
function inferGroupsFromDay(exs: Array<{ musclegroups_id?: number | null }>): string[] {
  const rawIds = (exs || [])
    .map(e => Number(e.musclegroups_id))
    .filter(n => Number.isFinite(n)) as number[];

  const uniqueIds = Array.from(new Set(rawIds));
  if (uniqueIds.length) {
    return uniqueIds.map(id => ID_TO_GROUP_NAME[id] ?? `Gruppo ${id}`);
  }
  // Se non riusciamo a inferire i gruppi dagli esercizi → Full Body (mostra tutto)
  return ["Full Body"];
}

/* =========================
   Pagina
   ========================= */
export default function WorkoutPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const editSchedule = (location?.state?.editSchedule ?? null) as
    | (ScheduleDetail & { /* opzionali se servono extra */ })
    | null;

  // Tipo locale per quello che ricevi da ScheduleDetailPage
  type ScheduleDetail = {
    id: number;
    goal: "peso_costante" | "aumento_peso" | "perdita_peso" | "altro";
    expire: string | null;
    days: Array<{
      id: number;
      day: number;
      exercises: Array<{
        exercise_id?: number | null;
        musclegroups_id?: number | null;
        name: string;
        sets: number | null;
        reps: number | null;
        rest_seconds: number | null;
        weight_value: number | null;
        notes: string | null;
      }>;
    }>;
  };

  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);

  // === Snapshot iniziale + state ===
  const snap = readAuthSnapshot();
  const token = snap.token;
  const [user, setUser] = useState<AuthUser>(snap.user);

  const isProfessional = getIsProfessional(user);

  const [giorni, setGiorni] = useState<number | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [giorniAllenamento, setGiorniAllenamento] = useState<GiornoAllenamento[]>([]);
  const [mostraEsercizi, setMostraEsercizi] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [expireDate, setExpireDate] = useState<string>("");
  const [goal, setGoal] = useState<Goal | "">("");

  const [loadingEx, setLoadingEx] = useState<boolean>(false);
  const [availableExercises, setAvailableExercises] = useState<DBExercise[]>([]);
  const [availableByDay, setAvailableByDay] = useState<Record<number, DBExercise[]>>({});

  const [consentAccepted, setConsentAccepted] = useState(false);

  const exportRef = useRef<HTMLElement | null>(null);

  const [ownerMode, setOwnerMode] = useState<OwnerMode>("self");

  const [loadingSelf, setLoadingSelf] = useState(false);
  const [selfData, setSelfData] = useState<UserAnthro>({
    first_name: user?.first_name ?? undefined,
    last_name: user?.last_name ?? undefined,
    sex: (user?.sex as any) ?? undefined,
    dob: user?.dob ?? undefined,
    weight: (user as any)?.latest_weight ?? user?.customer?.weight ?? null,
    height: (user as any)?.height ?? user?.customer?.height ?? null,
  });

  // Stato per banner “salvato”
  const [saveSuccess, setSaveSuccess] = useState<{ id: number } | null>(null);

  // === Stati per gestione clienti esterni ===
  const [otherOwnerMode, setOtherOwnerMode] = useState<"existing" | "manual">(
    isProfessional ? "existing" : "manual"
  );

  const [customers, setCustomers] = useState<CustomerDetail[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const [otherPerson, setOtherPerson] = useState({
    first_name: "",
    last_name: "",
    sex: "O" as "M" | "F" | "O",
    age: "" as number | "",
    weight: "" as number | "",
    height: "" as number | "",
  });

  // ========= PATCH MODIFICA: precompila tutto quando arrivi da "Modifica scheda" =========
  useEffect(() => {
    if (!editSchedule) return;

    (async () => {
      // salta consenso e wizard gruppi
      setConsentAccepted(true);

      setEditingScheduleId(editSchedule.id);
      setExpireDate(editSchedule.expire?.slice(0, 10) || "");

      const goalMap: Record<string, Goal> = {
        peso_costante: "peso_costante",
        perdita_peso: "perdita_peso",
        aumento_peso: "aumento_peso",
        altro: "altro",
      };
      setGoal(goalMap[editSchedule.goal] ?? "peso_costante");

      // 1) Mappa i giorni UI + inferisci i gruppi dal contenuto
      const mapped = editSchedule.days.map(d => {
        const groups = inferGroupsFromDay(d.exercises as any[]);
        return {
          giorno: d.day,
          gruppi: groups,
          gruppiConfermati: true,
          esercizi: d.exercises.map(ex => ({
            exerciseId: (ex as any).exercise_id ?? undefined,
            nome: ex.name || "",
            serie: ex.sets != null ? String(ex.sets) : "",
            ripetizioni: ex.reps != null ? String(ex.reps) : "",
            recupero: ex.rest_seconds != null ? String(ex.rest_seconds) : "",
            peso: ex.weight_value != null ? String(ex.weight_value) : "",
            note: ex.notes ?? undefined,
          })),
        } as GiornoAllenamento;
      });

      setGiorni(editSchedule.days.length);
      setGiorniAllenamento(mapped);

      // 2) Prefetch opzioni per OGNI giorno in base ai gruppi inferiti
      const byDay: Record<number, DBExercise[]> = {};
      for (const day of mapped) {
        try {
          const opts = await fetchExercisesForGroups(day.gruppi);
          byDay[day.giorno] = opts;
        } catch {
          byDay[day.giorno] = [];
        }
      }
      setAvailableByDay(byDay);

      // 3) Imposta giorno corrente e opzioni della tendina
      const firstDay = mapped[0]?.giorno ?? 1;
      setCurrentDay(firstDay);
      setAvailableExercises(byDay[firstDay] ?? []);

      // 4) Mostra direttamente il pannello esercizi
      setMostraEsercizi(true);
    })();
  }, [editSchedule]);

  // Se i dati sono incompleti, prova ad arricchirli da /api/me
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!token) return;

        const needHydrate =
          !user?.customer ||
          (user.customer && (user.customer.weight == null || user.customer.height == null)) ||
          !user?.type ||
          !getIsProfessional(user);

        if (!needHydrate) return;

        const res = await fetch(`/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        const profNorm = normalizeProfessionalFromMePayload(data);

        const enriched: Partial<AuthUser> = {
          first_name: (data?.user?.first_name ?? data?.first_name ?? user.first_name),
          last_name:  (data?.user?.last_name  ?? data?.last_name  ?? user.last_name),
          sex:        (data?.user?.sex        ?? data?.sex        ?? user.sex),
          dob:        (data?.user?.dob        ?? data?.dob        ?? user.dob),
          type:       ((data?.user?.type      ?? data?.type      ?? user.type) as any),
          customer:   (data?.customer ?? data?.user?.customer ?? user.customer ?? null),

          professional: profNorm.professional ?? user.professional ?? null,
          freelancer:   profNorm.freelancer   ?? user.freelancer   ?? null,
          prof:         user.prof ?? null,
          freelancer_id: profNorm.freelancer_id ?? user.freelancer_id ?? null,
        };
        if (!cancelled) setUser((prev) => ({ ...prev, ...enriched }));
      } catch {
        // silenzioso
      }
    })();
    return () => { cancelled = true; };
  }, [token, user?.customer, user?.type, user?.professional, user?.freelancer, user?.freelancer_id]);

  // Carica profilo self (dettagli mostrati)
  useEffect(() => {
    if (ownerMode !== "self" || !token) return;

    (async () => {
      try {
        setLoadingSelf(true);
        const res = await fetch(`/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const me = await res.json();
          setSelfData({
            first_name: me.first_name ?? undefined,
            last_name:  me.last_name ?? undefined,
            sex:        (me.sex ?? undefined) as any,
            dob:        me.dob ?? undefined,
            weight:     (me.latest_weight ?? me.weight ?? me.customer?.weight ?? null),
            height:     (me.height ?? me.customer?.height ?? null),
          });
        }
      } catch (e) {
        console.error("Errore /api/me", e);
      } finally {
        setLoadingSelf(false);
      }
    })();
  }, [ownerMode, token]);

  // Carica SEMPRE tutti i customer se l'utente è professionista (o admin)
  useEffect(() => {
    if (!isProfessional || !token) return;

    (async () => {
      try {
        const res = await fetch(`/api/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const rows = await res.json();
        const mapped: CustomerDetail[] = rows.map((r: any) => ({
          customer_id: Number(r.customer_id ?? r.id),
          user_id: r.user_id ?? null,
          username: r.username ?? null,
          email: r.email ?? null,
          first_name: r.first_name ?? null,
          last_name: r.last_name ?? null,
          sex: (r.sex as any) ?? null,
          dob: r.dob ?? null,
          height: (typeof r.height === "number" ? r.height : null),
          latest_weight: (typeof r.latest_weight === "number" ? r.latest_weight : null),
        }));
        setCustomers(mapped);
      } catch (e) {
        console.error("Errore caricamento /api/customers", e);
      }
    })();
  }, [isProfessional, token]);

  // autocompila i dettagli quando selezioni un cliente
  useEffect(() => {
    if (ownerMode !== "other" || otherOwnerMode !== "existing" || !selectedCustomerId) return;
    const c = customers.find((x) => x.customer_id === Number(selectedCustomerId));
    if (!c) return;
    const age = ageFromDOB(c.dob ?? null);
    setOtherPerson({
      first_name: c.first_name || "",
      last_name:  c.last_name  || "",
      sex: (c.sex ?? "O") as any,
      age: (typeof age === "number" ? age : "") as any,
      weight: (c.latest_weight ?? "") as any,
      height: (c.height ?? "") as any,
    });
  }, [ownerMode, otherOwnerMode, selectedCustomerId, customers]);

  // Inizializza i giorni quando l’utente sceglie il numero (solo creazione)
  useEffect(() => {
    if (giorni && giorni > 0 && !editingScheduleId) {
      setGiorniAllenamento(
        Array.from({ length: giorni }, (_, i) => ({
          giorno: i + 1,
          gruppi: [],
          esercizi: [],
          gruppiConfermati: false,
        }))
      );
      setCurrentDay(1);
      setMostraEsercizi(false);
      setAvailableExercises([]);
      setAvailableByDay({});
    }
  }, [giorni, editingScheduleId]);

  const giornoCorrente = giorniAllenamento.find((g) => g.giorno === currentDay);

  /* Helpers */
  const namesToGroupIds = (names: string[]) => {
    const expanded = names.includes("Full Body")
      ? Array.from(new Set([...names, ...Object.keys(GROUP_NAME_TO_ID)]))
      : names;
    return Array.from(new Set(expanded.map((n) => GROUP_NAME_TO_ID[n]).filter(Boolean)));
  };

  const fetchExercisesForGroups = async (groupNames: string[]): Promise<DBExercise[]> => {
    const ids = namesToGroupIds(groupNames);
    if (!ids.length) return [];

    const qs = `groupIds=${encodeURIComponent(ids.join(","))}`;
    const res = await fetch(`/api/exercises?${qs}`);

    if (!res.ok) throw new Error(`Errore fetch esercizi: ${res.status}`);

    const raw = (await res.json()) as {
      id: number;
      title: string;
      musclegroups_id: number;
      weight_required?: string;
    }[];

    return raw.map((r) => ({
      id: r.id,
      name: r.title,
      musclegroups_id: r.musclegroups_id,
      groupLabel: ID_TO_GROUP_NAME[r.musclegroups_id] || String(r.musclegroups_id),
      weightRequired: (r.weight_required || "n").toLowerCase() === "y",
    }));
  };

  /* Selezione gruppi */
  const handleSelezionaGruppo = (gruppo: string) => {
    setGiorniAllenamento((prev) =>
      prev.map((g) => {
        if (g.giorno !== currentDay) return g;
        if (g.gruppiConfermati) return g;

        let nuoviGruppi = [...g.gruppi];
        if (gruppo === "Full Body") {
          nuoviGruppi = ["Full Body"];
        } else {
          if (nuoviGruppi.includes("Full Body")) {
            nuoviGruppi = [gruppo];
          } else {
            if (nuoviGruppi.includes(gruppo)) {
              nuoviGruppi = nuoviGruppi.filter((x) => x !== gruppo);
            } else {
              nuoviGruppi.push(gruppo);
            }
          }
        }
        return { ...g, gruppi: nuoviGruppi };
      })
    );
  };

  // Fetch unico e cache per giorno
  const handleConfermaGruppi = async () => {
    if (!giornoCorrente || !giornoCorrente.gruppi.length) return;
    try {
      setLoadingEx(true);
      const data = await fetchExercisesForGroups(giornoCorrente.gruppi);
      setAvailableByDay((prev) => ({ ...prev, [currentDay]: data })); // cache
      setAvailableExercises(data);
      setGiorniAllenamento((prev) =>
        prev.map((g) => (g.giorno === currentDay ? { ...g, gruppiConfermati: true } : g))
      );
      setMostraEsercizi(true);
      setGiorniAllenamento((prev) =>
        prev.map((g) => {
          if (g.giorno !== currentDay) return g;
          if (g.esercizi.length === 0) {
            return {
              ...g,
              esercizi: [
                { exerciseId: undefined, nome: "", serie: "", ripetizioni: "", recupero: "", peso: "", note: undefined },
              ],
            };
          }
          return g;
        })
      );
    } catch (e) {
      console.error(e);
      alert("Non sono riuscito a caricare gli esercizi dal database.");
    } finally {
      setLoadingEx(false);
    }
  };

  const handleCambiaGruppo = () => {
    if (!confirm("Cambiando i gruppi di questo giorno, gli esercizi inseriti verranno eliminati. Continuare?")) return;
    setGiorniAllenamento((prev) =>
      prev.map((g) =>
        g.giorno === currentDay ? { ...g, gruppi: [], esercizi: [], gruppiConfermati: false } : g
      )
    );
    setAvailableByDay((prev) => {
      const { [currentDay]: _, ...rest } = prev;
      return rest;
    });
    setAvailableExercises([]);
    setMostraEsercizi(false);
  };

  const handleSwitchDay = (num: number) => {
    setCurrentDay(num);
    const d = giorniAllenamento.find((g) => g.giorno === num);
    setMostraEsercizi(!!d?.gruppiConfermati);
    setAvailableExercises(availableByDay[num] ?? []);
  };

  const handleAggiungiEsercizio = () => {
    setGiorniAllenamento((prev) =>
      prev.map((g) =>
        g.giorno === currentDay
          ? {
              ...g,
              esercizi: [
                ...g.esercizi,
                { exerciseId: undefined, nome: "", serie: "", ripetizioni: "", recupero: "", peso: "" },
              ],
            }
          : g
      )
    );
  };

  const handleEliminaEsercizio = (index: number) => {
    setGiorniAllenamento((prev) =>
      prev.map((g) => {
        if (g.giorno !== currentDay) return g;
        const next = [...g.esercizi];
        next.splice(index, 1);
        return { ...g, esercizi: next };
      })
    );
  };

  // set multiplo quando cambia esercizio (ID + nome, reset peso se non richiesto)
  const handleSetExerciseSelection = (index: number, opt: DBExercise) => {
    setGiorniAllenamento((prev) =>
      prev.map((g) => {
        if (g.giorno !== currentDay) return g;
        const next = g.esercizi.map((ex, i) => {
          if (i !== index) return ex;
          const nextEx: Esercizio = {
            ...ex,
            exerciseId: opt.id,
            nome: opt.name,
          };
          if (!opt.weightRequired) nextEx.peso = "";
          return nextEx;
        });
        return { ...g, esercizi: next };
      })
    );
  };

  const handleAggiornaEsercizio = (index: number, field: keyof Esercizio, value: string) => {
    if (field === "nome" && value === "") return;
    setGiorniAllenamento((prev) =>
      prev.map((g) =>
        g.giorno === currentDay
          ? { ...g, esercizi: g.esercizi.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)) }
          : g
      )
    );
  };

  const handleToggleNota = (index: number) => {
    setGiorniAllenamento((prev) =>
      prev.map((g) => {
        if (g.giorno !== currentDay) return g;
        const next = g.esercizi.map((ex, i) => {
          if (i !== index) return ex;
          if (ex.note === undefined) {
            return { ...ex, note: "" };
          } else {
            const { note, ...rest } = ex as any;
            return rest as Esercizio;
          }
        });
        return { ...g, esercizi: next };
      })
    );
  };

  /* Anteprima / Download / Salvataggio */
  // Helpers numerici
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  // --- VALIDAZIONE: almeno un esercizio completo per ogni giorno confermato ---
  const isExerciseComplete = (dayNum: number, ex: Esercizio): boolean => {
    if (!ex.exerciseId) return false;
    const hasSerie = ex.serie !== "";
    const hasRip = ex.ripetizioni !== "";
    const hasRec = ex.recupero !== "";
    const list = availableByDay[dayNum] ?? [];
    const opt = list.find((o) => o.id === ex.exerciseId);
    const needsWeight = opt?.weightRequired ?? false;
    const hasPeso = needsWeight ? (ex.peso != null && ex.peso !== "") : true;
    return hasSerie && hasRip && hasRec && hasPeso;
  };

  const allConfirmedDaysHaveAtLeastOneComplete = (): { ok: boolean; missingDay?: number } => {
    for (const g of giorniAllenamento) {
      if (!g.gruppiConfermati) continue;
      const anyComplete = (g.esercizi || []).some((ex) => isExerciseComplete(g.giorno, ex));
      if (!anyComplete) return { ok: false, missingDay: g.giorno };
    }
    return { ok: true };
  };

  const handleGoToPreview = () => {
    if (!expireDate) {
      alert("Imposta una data di scadenza prima di continuare.");
      return;
    }
    if (!goal) {
      alert("Seleziona un obiettivo.");
      return;
    }
    if (ownerMode === "other") {
      if (isProfessional && otherOwnerMode === "existing") {
        if (!selectedCustomerId) {
          alert("Seleziona un cliente esistente.");
          return;
        }
      } else {
        const okOwner =
          otherPerson.first_name.trim() &&
          otherPerson.last_name.trim() &&
          otherPerson.sex &&
          otherPerson.age !== "" &&
          otherPerson.weight !== "" &&
          otherPerson.height !== "";
        if (!okOwner) {
          alert("Compila i dati dell’intestatario.");
          return;
        }
      }
    }
    const chk = allConfirmedDaysHaveAtLeastOneComplete();
    if (!chk.ok) {
      alert(`Completa almeno un esercizio nel Giorno ${chk.missingDay}.`);
      return;
    }

    setShowPreview(true);
    setSaveSuccess(null); // reset eventuale banner
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveToDb = async (customerIdOverride?: number | null) => {
    try {
      if (!expireDate || !goal || !giorniAllenamento.length) {
        alert("Compila tutti i campi della scheda prima di salvare.");
        return;
      }

      const goalMap: Record<string, string> = {
        peso_costante: "peso_costante",
        perdita_peso: "perdita_peso",
        aumento_peso: "aumento_peso",
        altro: "altro",
      };
      const goalForApi = goalMap[goal as string] ?? "peso_costante";

      const resolvedCustomerId =
        typeof customerIdOverride === "number"
          ? customerIdOverride
          : getResolvedCustomerId(user, ownerMode, isProfessional, otherOwnerMode, selectedCustomerId);

      if (!resolvedCustomerId && !editingScheduleId) {
        alert("Seleziona un cliente esistente (o assicurati che l’utente abbia un record in 'customers').");
        return;
      }

      const auth = JSON.parse(localStorage.getItem("authData") || "{}");
      const tokenLS: string | null = snap.token || auth?.token || null;

      const toIntOrNull = (val: string | undefined | null, max: number): number | null => {
        if (val == null || val === "") return null;
        const n = Math.floor(Number(val));
        if (!Number.isFinite(n)) return null;
        return Math.min(max, Math.max(0, n));
      };
      const toWeightOrNull = (val: string | undefined | null): number | null => {
        if (val == null || val === "") return null;
        const n = Number(val);
        if (!Number.isFinite(n)) return null;
        const clamped = Math.min(9999.99, Math.max(0, n));
        return Math.round(clamped * 100) / 100;
      };

      // ================================
      // A) MODIFICA scheda esistente
      // ================================
      if (editingScheduleId) {
        const putRes = await fetch(`/api/schedules/${editingScheduleId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(tokenLS ? { Authorization: `Bearer ${tokenLS}` } : {}),
          },
          body: JSON.stringify({
            expire: expireDate,
            goal: goalForApi,
          }),
        });

        if (putRes.status === 404) {
          console.warn("PUT /api/schedules/:id non disponibile: creo nuova scheda come fallback.");
        } else if (!putRes.ok) {
          const text = await putRes.text().catch(() => "");
          alert(`❌ Aggiornamento scheda rifiutato (${putRes.status}).\n${text || "Controlla i campi inviati."}`);
          throw new Error("Errore update schedule");
        } else {
          // 2) Rimpiazza giorni+esercizi
          const replacePayload = {
            days: giorniAllenamento.map((g) => ({
              day: g.giorno,
              exercises: g.esercizi
                .filter((ex) => ex.exerciseId || ex.nome)
                .map((ex, idx) => ({
                  position: idx + 1,
                  exercise_id: ex.exerciseId ?? null,
                  name: ex.nome || null,
                  sets: toIntOrNull(ex.serie, 255),
                  reps: toIntOrNull(ex.ripetizioni, 255),
                  rest_seconds: toIntOrNull(ex.recupero, 65535),
                  weight_value: toWeightOrNull(ex.peso),
                  notes: ex.note ?? null,
                })),
            })),
          };

          const repRes = await fetch(`/api/schedules/${editingScheduleId}/replace`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(tokenLS ? { Authorization: `Bearer ${tokenLS}` } : {}),
            },
            body: JSON.stringify(replacePayload),
          });

          if (repRes.status === 404) {
            console.warn("POST /api/schedules/:id/replace non disponibile: creo nuova scheda come fallback.");
          } else if (!repRes.ok) {
            const t = await repRes.text().catch(() => "");
            alert(`❌ Aggiornamento giorni/esercizi rifiutato (${repRes.status}).\n${t || "Controlla i valori inseriti."}`);
            throw new Error("Errore replace giorni/esercizi");
          } else {
            setSaveSuccess({ id: editingScheduleId });
            return;
          }
        }
        // se uno dei due endpoint manca → passa alla creazione nuova
      }

      // ================================
      // B) CREA nuova scheda
      // ================================
      const schedulePayload: any = {
        customer_id: resolvedCustomerId,
        expire: expireDate,
        goal: goalForApi,
      };

      const res = await fetch(`/api/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tokenLS ? { Authorization: `Bearer ${tokenLS}` } : {}),
        },
        body: JSON.stringify(schedulePayload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Errore /api/schedules:", res.status, text);
        alert(`❌ Creazione scheda rifiutata (${res.status}).\n${text || "Controlla i campi inviati."}`);
        throw new Error("Errore creazione schedule");
      }

      const schedule = await res.json();
      const scheduleId: number = schedule.id;
      if (!Number.isFinite(scheduleId)) {
        alert("❌ Risposta inattesa dal server (manca l'ID scheda).");
        return;
      }

      // Crea i giorni
      const dayMap: Record<number, number> = {};
      for (const g of giorniAllenamento) {
        const dayRes = await fetch(`/api/schedules/day`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tokenLS ? { Authorization: `Bearer ${tokenLS}` } : {}),
          },
          body: JSON.stringify({ schedule_id: scheduleId, day: g.giorno }),
        });
        if (!dayRes.ok) {
          const text = await dayRes.text().catch(() => "");
          console.error("Errore /api/schedules/day:", dayRes.status, text);
          alert(`❌ Creazione giorno ${g.giorno} rifiutata (${dayRes.status}).\n${text || "Controlla i campi."}`);
          throw new Error("Errore creazione giorno");
        }
        const day = await dayRes.json();
        dayMap[g.giorno] = Number(day.id);
      }

      // Prepara esercizi
      const allExercises = giorniAllenamento.flatMap((g) =>
        g.esercizi
          .filter((ex) => ex.exerciseId)
          .map((ex, idx) => ({
            day_id: dayMap[g.giorno],
            exercise_id: ex.exerciseId as number,
            position: idx + 1,
            sets: toIntOrNull(ex.serie, 255),
            reps: toIntOrNull(ex.ripetizioni, 255),
            rest_seconds: toIntOrNull(ex.recupero, 65535),
            weight_value: toWeightOrNull(ex.peso),
            notes: ex.note ?? null,
          }))
      );

      if (allExercises.length) {
        const exRes = await fetch(`/api/schedules/exercises`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tokenLS ? { Authorization: `Bearer ${tokenLS}` } : {}),
          },
          body: JSON.stringify({ scheduleId, items: allExercises }),
        });

        if (!exRes.ok) {
          const text = await exRes.text().catch(() => "");
          console.error("Errore /api/schedules/exercises:", exRes.status, text);
          alert(`❌ Salvataggio esercizi rifiutato (${exRes.status}).\n${text || "Controlla i valori di serie/rip/rec/kg."}`);
          throw new Error("Errore salvataggio esercizi");
        }
      }

      setSaveSuccess({ id: scheduleId });

    } catch (err) {
      console.error(err);
    }
  };

  // === Dati per la vista off-screen (export one-column)
  const exportDays: ExportWorkoutDay[] = Array.from({ length: giorni ?? 0 }).map((_, i) => {
    const g = giorniAllenamento.find((x) => x.giorno === i + 1);
    return {
      label: `Giorno ${i + 1}`,
      groups: g?.gruppi ?? [],
      items: (g?.esercizi ?? []).map((ex) => ({
        name: ex.nome || "—",
        serie: ex.serie ?? "",
        ripetizioni: ex.ripetizioni ?? "",
        recupero: ex.recupero ?? "",
        peso: ex.peso ?? "",
        note: ex.note ?? "",
      })),
    };
  });

  /* =========================
     Render (Allenamento)
  ========================= */
  const goalForExport: Goal = isGoal(goal) && goal !== "altro" ? goal : "peso_costante";

  const intestatarioLabel =
    ownerMode === "self"
      ? `${selfData.first_name ?? ""} ${selfData.last_name ?? ""}`.trim() || (JSON.parse(localStorage.getItem("authData") || "{}")?.username || "—")
      : otherOwnerMode === "existing"
        ? (() => {
            const c = customers.find(x => x.customer_id === Number(selectedCustomerId));
            return c ? formatCustomerLabel(c) : "Intestatario esterno";
          })()
        : `${otherPerson.first_name} ${otherPerson.last_name}`.trim() || "Intestatario esterno";

  const resolvedCustomerIdForPreview = getResolvedCustomerId(
    user,
    ownerMode,
    isProfessional,
    otherOwnerMode,
    selectedCustomerId
  );

  // === VISTA SOLO-CONSENSO (creazione) ===
  if (!consentAccepted && !editingScheduleId) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-10 mb-24">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border dark:border-gray-800">
          <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-3">
            Informativa & consenso
          </h2>
          <div className="text-sm text-gray-700 dark:text-gray-200 space-y-3">
            <p>
              Questo generatore di schede di allenamento ha finalità informative ed educative.
              Non sostituisce il parere di un medico o di un professionista qualificato.
              In presenza di condizioni cliniche, infortuni, gravidanza o terapie in corso,
              consulta il tuo medico prima di intraprendere qualsiasi programma di allenamento.
            </p>
            <p>
              Dichiari di utilizzare il piano sotto la tua esclusiva responsabilità.
              Gli autori dell’app non sono responsabili per eventuali conseguenze derivanti
              da un uso improprio delle indicazioni fornite. In caso di dolore, capogiri, affanno
              anomalo o altri sintomi, interrompi l’attività e chiedi un parere medico.
            </p>
            <ul className="list-disc ml-5">
              <li>Riscaldati adeguatamente e rispetta i tempi di recupero.</li>
              <li>Usa carichi adeguati al tuo livello e a tecnica corretta.</li>
              <li>Idratati e ascolta i segnali del tuo corpo.</li>
            </ul>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200"
              onClick={() => window.history.back()}
            >
              Annulla
            </button>
            <button
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => setConsentAccepted(true)}
            >
              Accetto e procedo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-indigo-50 dark:bg-gray-950 px-8 py-12 text-gray-800 dark:text-gray-100">
      {giorni === null && !showPreview && (
        <motion.div
          key="allenamento-giorni"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 w-full max-w-2xl mt-10 text-center border border-transparent dark:border-gray-800"
        >
          <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 mb-6">Quanti giorni a settimana vuoi allenarti?</h2>
          <div className="flex justify-center flex-wrap gap-5">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <button
                key={num}
                onClick={() => setGiorni(num)}
                className="w-14 h-14 rounded-full bg-indigo-100 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold transition-all shadow dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-gray-700"
              >
                {num}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Wizard giorni/esercizi */}
      {giorni !== null && !showPreview && (
        <motion.div
          key="wizard"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 w-full max-w-5xl mt-10 flex flex-col items-center border border-transparent dark:border-gray-800"
        >
          {/* Pulsanti Giorni */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {Array.from({ length: giorni }).map((_, i) => (
              <button
                key={i}
                onClick={() => handleSwitchDay(i + 1)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  currentDay === i + 1
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-gray-700"
                }`}
              >
                Giorno {i + 1}
              </button>
            ))}
          </div>

          {/* header + nav */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => handleSwitchDay(Math.max(1, currentDay - 1))}
              disabled={currentDay === 1}
              className="p-3 rounded-full bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="w-6 h-6 text-indigo-700 dark:text-indigo-300" />
            </button>
            <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              Giorno {currentDay} di {giorni}
            </h2>
            <button
              onClick={() => handleSwitchDay(Math.min(giorni, currentDay + 1))}
              disabled={currentDay === giorni}
              className="p-3 rounded-full bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <ChevronRight className="w-6 h-6 text-indigo-700 dark:text-indigo-300" />
            </button>
          </div>

          {/* selezione gruppi / esercizi */}
          {!mostraEsercizi ? (
            <>
              <p className="text-indigo-700 dark:text-indigo-300 mb-6">Seleziona i gruppi muscolari da allenare</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-md mb-8">
                {["Petto", "Dorso", "Gambe", "Spalle", "Braccia", "Addome", "Full Body"].map((g) => {
                  const selezionato = !!giornoCorrente?.gruppi.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => handleSelezionaGruppo(g)}
                      disabled={!!giornoCorrente?.gruppiConfermati}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                        selezionato
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-indigo-50 hover:bg-indigo-100 border-indigo-100 text-indigo-700 dark:bg-gray-800 dark:text-indigo-300 dark:border-gray-700 dark:hover:bg-gray-700"
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
              {giornoCorrente?.gruppi.length ? (
                <button
                  onClick={handleConfermaGruppi}
                  className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all"
                >
                  Conferma gruppi del giorno
                </button>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between w-full mb-4">
                <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-300">Esercizi — Giorno {currentDay}</h3>
                <button onClick={handleCambiaGruppo} className="text-indigo-700 dark:text-indigo-300 hover:underline">
                  Modifica gruppi
                </button>
              </div>

              {loadingEx && <div className="w-full mb-3 text-sm text-indigo-700 dark:text-indigo-300">Caricamento esercizi dal database…</div>}

              {/* Righe esercizi */}
              {giornoCorrente?.esercizi.map((ex, i) => {
                const selectedOpt = ex.exerciseId
                  ? availableExercises.find((o) => o.id === ex.exerciseId)
                  : availableExercises.find((o) => o.name === ex.nome);
                const requires = selectedOpt?.weightRequired ?? false;
                const needWeightButEmpty = requires && (!ex.peso || ex.peso.trim() === "");

                return (
                  <div key={i} className="flex flex-col gap-2 mb-4 bg-indigo-50 dark:bg-gray-800 p-3 rounded-lg w-full">
                    {/* LABEL esercizio + elimina */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center text-[13px] font-semibold text-indigo-700 dark:text-indigo-300">
                        Esercizio {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEliminaEsercizio(i)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                        title="Elimina esercizio"
                      >
                        <Trash2 className="w-4 h-4" />
                        Elimina
                      </button>
                    </div>

                    {/* Riga principale con campi */}
                    <div className="flex flex-wrap items-center gap-3">
                      <ExerciseSelect
                        valueId={ex.exerciseId}
                        valueName={ex.nome}
                        onChange={(opt) => handleSetExerciseSelection(i, opt)}
                        options={availableExercises}
                        groupsOrder={namesToGroupIds(giornoCorrente?.gruppi ?? [])}
                        placeholder="Seleziona esercizio"
                      />

                      <input
                        type="number"
                        placeholder="Serie"
                        className="w-20 p-2 rounded-md border border-indigo-200 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                        value={ex.serie}
                        min={0}
                        max={255}
                        onChange={(e) => {
                          const v = toNum(e.target.value);
                          const next = Number.isNaN(v) ? "" : String(clamp(v, 0, 255));
                          handleAggiornaEsercizio(i, "serie", next);
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Rip."
                        className="w-20 p-2 rounded-md border border-indigo-200 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                        value={ex.ripetizioni}
                        min={0}
                        max={255}
                        onChange={(e) => {
                          const v = toNum(e.target.value);
                          const next = Number.isNaN(v) ? "" : String(clamp(v, 0, 255));
                          handleAggiornaEsercizio(i, "ripetizioni", next);
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Kg"
                        className={`w-20 p-2 rounded-md border bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 ${
                          requires
                            ? (needWeightButEmpty ? "border-red-400 dark:border-red-400" : "border-indigo-200 dark:border-gray-700")
                            : "border-gray-200 dark:border-gray-700 opacity-50"
                        }`}
                        value={ex.peso ?? ""}
                        min={0}
                        max={9999.99}
                        step="0.5"
                        onChange={(e) => {
                          const v = toNum(e.target.value);
                          const next = Number.isNaN(v) ? "" : String(Math.round(clamp(v, 0, 9999.99) * 100) / 100);
                          handleAggiornaEsercizio(i, "peso", next);
                        }}
                        disabled={!requires}
                      />
                      <input
                        type="number"
                        placeholder="Rec. (s)"
                        className="w-24 p-2 rounded-md border border-indigo-200 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                        value={ex.recupero}
                        min={0}
                        max={65535}
                        onChange={(e) => {
                          const v = toNum(e.target.value);
                          const next = Number.isNaN(v) ? "" : String(clamp(v, 0, 65535));
                          handleAggiornaEsercizio(i, "recupero", next);
                        }}
                      />

                      {/* Toggle note */}
                      <button
                        type="button"
                        onClick={() => handleToggleNota(i)}
                        className="px-3 py-2 text-sm rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-gray-700"
                      >
                        {ex.note === undefined ? "Aggiungi nota" : "Rimuovi nota"}
                      </button>
                    </div>

                    {ex.note !== undefined && (
                      <textarea
                        className="w-full mt-2 p-2 rounded-md border border-indigo-200 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 text-sm"
                        placeholder="Inserisci note (es. tecnica, respirazione, durata...)"
                        value={ex.note ?? ""}
                        onChange={(e) => handleAggiornaEsercizio(i, "note", e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
              <button
                onClick={handleAggiungiEsercizio}
                className="mt-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                <PlusCircle className="w-5 h-5" />
                Aggiungi esercizio
              </button>
            </>
          )}

          {/* Riepilogo + form impostazioni scheda */}
          <div className="mt-10 w-full">
            <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-3 text-center">Riepilogo allenamento</h3>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {Array.from({ length: giorni }).map((_, i) => {
                const g = giorniAllenamento.find((x) => x.giorno === i + 1);
                const eserciziCount = g?.esercizi.length ?? 0;
                return (
                  <div key={i} className="bg-indigo-50 dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 rounded-lg px-4 py-2 text-sm">
                    Giorno {i + 1}:{" "}
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                      {g?.gruppi.length ? g.gruppi.join(", ") : "-"}
                    </span>
                    {g?.gruppiConfermati ? (
                      <span className="ml-2 text-xs text-green-700 dark:text-green-300">
                        (confermato{eserciziCount ? `, ${eserciziCount} esercizi` : ""})
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Form: intestatario + scadenza + obiettivo */}
            <div className="max-w-2xl mx-auto bg-indigo-50/60 dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 rounded-xl p-5 mb-6">
              <h4 className="text/base font-semibold text-indigo-800 dark:text-indigo-300 mb-4">Impostazioni scheda</h4>

              {/* Intestatario */}
              <div className="mb-4">
                <label className="block text-sm text-indigo-700 dark:text-indigo-300 mb-2">Intestatario</label>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={ownerMode === "self"}
                      onChange={() =>  {
                        setOwnerMode("self");
                        setSelectedCustomerId("");
                        setOtherOwnerMode(isProfessional ? "existing" : "manual");
                      }}
                    />
                    <span>Me stesso</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={ownerMode === "other"}
                      onChange={() => {
                        setOwnerMode("other");
                        setSelectedCustomerId("");
                      }}
                    />
                    <span>Un’altra persona</span>
                  </label>
                </div>

                {/* Se OTHER: professionista vede sempre la tendina con TUTTI i customer */}
                {ownerMode === "other" && isProfessional && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={otherOwnerMode === "existing"}
                          onChange={() => setOtherOwnerMode("existing")}
                        />
                        <span>Cliente esistente</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={otherOwnerMode === "manual"}
                          onChange={() => setOtherOwnerMode("manual")}
                        />
                        <span>Inserimento manuale</span>
                      </label>
                    </div>

                    {otherOwnerMode === "existing" && (
                      <>
                        <div className="flex items-end gap-3 flex-wrap">
                          <div className="grow min-w-[280px]">
                            <label className="block text-sm text-indigo-700 dark:text-indigo-300 mb-1">Seleziona cliente</label>
                            <select
                              className="min-w-[260px] p-2 border rounded w-full dark:bg-gray-900 dark:border-gray-700"
                              value={selectedCustomerId}
                              onChange={(e) => setSelectedCustomerId(e.target.value)}
                            >
                              <option value="" disabled>— Scegli un cliente —</option>
                              {customers.map((c) => (
                                <option key={c.customer_id} value={c.customer_id}>
                                  {formatCustomerLabel(c)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            className="px-3 py-2 rounded-lg border border-indigo-200 dark:border-gray-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-gray-800 text-sm"
                            onClick={() => setSelectedCustomerId("")}
                            title="Pulisci selezione"
                          >
                            Pulisci
                          </button>
                        </div>

                        {/* Dati riassuntivi cliente selezionato */}
                        {selectedCustomerId && (() => {
                          const c = customers.find(x => x.customer_id === Number(selectedCustomerId));
                          if (!c) return null;
                          const age = ageFromDOB(c.dob ?? null);
                          return (
                            <div className="mt-3 text-sm text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-900/40 border border-indigo-100 dark:border-gray-700 rounded-md p-3">
                              <div className="font-semibold mb-1">Dettagli cliente</div>
                              <div className="flex flex-wrap gap-6">
                                <div>Nome: <strong>{c.first_name ?? "-"}</strong></div>
                                <div>Cognome: <strong>{c.last_name ?? "-"}</strong></div>
                                <div>Età: <strong>{typeof age === "number" ? age : "-"}</strong></div>
                                <div>Altezza: <strong>{c.height ?? "-"} cm</strong></div>
                                <div>Peso: <strong>{c.latest_weight ?? "-"} kg</strong></div>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}

                {/* Dati intestatario mostrati */}
                {ownerMode === "self" ? (
                  <div className="mt-3 text-sm text-gray-700 dark:text-gray-200">
                    {loadingSelf ? (
                      <span>Caricamento profilo…</span>
                    ) : (
                      <div className="flex flex-wrap gap-6">
                        <div>Nome: <strong>{selfData.first_name ?? "-"}</strong></div>
                        <div>Cognome: <strong>{selfData.last_name ?? "-"}</strong></div>
                        <div>Sesso: <strong>{selfData.sex ?? "-"}</strong></div>
                        <div>Età: <strong>{ageFromDOB(selfData.dob ?? null) ?? "-"}</strong></div>
                        <div>Peso: <strong>{selfData.weight ?? "-"} kg</strong></div>
                        <div>Altezza: <strong>{selfData.height ?? "-"} cm</strong></div>
                      </div>
                    )}
                  </div>
                ) : (
                  (!isProfessional || otherOwnerMode === "manual") && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-indigo-700 dark:text-indigo-300">Nome</label>
                        <input
                          className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700"
                          value={otherPerson.first_name}
                          onChange={(e) => setOtherPerson((s) => ({ ...s, first_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-indigo-700 dark:text-indigo-300">Cognome</label>
                        <input
                          className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700"
                          value={otherPerson.last_name}
                          onChange={(e) => setOtherPerson((s) => ({ ...s, last_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-indigo-700 dark:text-indigo-300">Sesso</label>
                        <select
                          className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700"
                          value={otherPerson.sex}
                          onChange={(e) => setOtherPerson((s) => ({ ...s, sex: e.target.value as any }))}
                        >
                          <option value="M">Maschio</option>
                          <option value="F">Femmina</option>
                          <option value="O">Altro</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-indigo-700 dark:text-indigo-300">Età</label>
                        <input
                          type="number"
                          className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700"
                          value={otherPerson.age}
                          onChange={(e) => setOtherPerson((s) => ({ ...s, age: e.target.value === "" ? "" : Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-indigo-700 dark:text-indigo-300">Peso (kg)</label>
                        <input
                          type="number"
                          className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700"
                          value={otherPerson.weight}
                          onChange={(e) => setOtherPerson((s) => ({ ...s, weight: e.target.value === "" ? "" : Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-indigo-700 dark:text-indigo-300">Altezza (cm)</label>
                        <input
                          type="number"
                          className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700"
                          value={otherPerson.height}
                          onChange={(e) => setOtherPerson((s) => ({ ...s, height: e.target.value === "" ? "" : Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Scadenza + Obiettivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm text-indigo-700 dark:text-indigo-300 mb-1">Scadenza scheda</label>
                  <input
                    type="date"
                    className="p-2 rounded-md border border-indigo-200 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-indigo-700 dark:text-indigo-300 mb-1">Obiettivo</label>
                  <select
                    className="w-56 sm:w-60 p-2 rounded-md border border-indigo-200 bg-white"
                    value={goal || ""}
                    onChange={(e) => setGoal(e.target.value as Goal | "")}
                  >
                    <option value="" disabled hidden>Seleziona obiettivo</option>
                    <option value="peso_costante">Peso costante</option>
                    <option value="perdita_peso">Perdita peso</option>
                    <option value="aumento_peso">Aumento peso</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleGoToPreview}
                className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all"
              >
                Conferma e vai all’anteprima
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ANTEPRIMA */}
      {showPreview && (
        <motion.div
          key="preview"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-5xl mt-4 border border-transparent dark:border-gray-800"
        >
          <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-3 text-center">
            Anteprima scheda allenamento
          </h2>

          {/* ✅ Banner successo dopo salvataggio */}
          {saveSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 text-emerald-800 dark:text-emerald-200">
              <div className="font-semibold">
                Scheda salvata con successo (ID {saveSuccess.id}).
              </div>
              <div className="mt-2 flex gap-8 items-center flex-wrap">
                <span className="text-sm">Puoi visualizzarla nella lista delle schede.</span>
                <button
                  type="button"
                  onClick={() => navigate("/schedules")}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Vai ai miei piani
                </button>
              </div>
            </div>
          )}

          {/* VISTA OFF-SCREEN per export */}
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              opacity: 0,
              pointerEvents: "none",
              zIndex: -1,
            }}
          >
            <ExportWorkoutPreview
              ref={exportRef}
              meta={{
                expire: expireDate || "—",
                goal: goalForExport,
                logoPath: logoUrl,
                ownerName: intestatarioLabel,
                professionalName: isProfessional ? getProfessionalDisplay() : undefined,
              }}
              days={exportDays}
            />
          </div>

          {/* Anteprima visiva compatta */}
          <div className="relative bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            {/* HEADER COMPATTO */}
            <div className="mb-2">
              <div className="flex items-start justify-between">
                <div className="leading-tight">
                  <h3 className="text/base font-semibold text-gray-800 dark:text-gray-100 m-0">
                    Scheda Allenamento{intestatarioLabel ? ` di: ${intestatarioLabel}` : ""}
                  </h3>
                  {isProfessional && getProfessionalDisplay() && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 -mt-0.5">
                      <em>curata da: {getProfessionalDisplay()}</em>
                    </div>
                  )}
                  {isProfessional && resolvedCustomerIdForPreview && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Salvataggio: <strong>professionista</strong> → cliente ID <strong>{resolvedCustomerIdForPreview}</strong>
                    </div>
                  )}
                </div>
                <img
                  src={logoUrl}
                  alt="MyFit"
                  className="w-12 h-12 object-contain pointer-events-none select-none"
                  loading="eager"
                  crossOrigin="anonymous"
                />
              </div>

              {/* metadati, margine piccolo */}
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                <span className="mr-4"><strong>Scadenza:</strong> {expireDate || "—"}</span>
                <span><strong>Obiettivo:</strong> {
                  goalForExport === "peso_costante" ? "Peso costante" :
                  goalForExport === "perdita_peso" ? "Perdita peso" :
                  goalForExport === "aumento_peso" ? "Aumento peso" : "—"
                }</span>
              </div>
            </div>

            {/* scheda */}
            <div className="grid md:grid-cols-2 gap-4">
              {Array.from({ length: giorni ?? 0 }).map((_, i) => {
                const g = giorniAllenamento.find((x) => x.giorno === i + 1);
                return (
                  <div key={i} className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-100">Giorno {i + 1}</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{g?.gruppi?.length ? g.gruppi.join(", ") : "—"}</span>
                    </div>
                    <div className="space-y-3">
                      {g?.esercizi?.length ? (
                        g.esercizi.map((ex, idx) => (
                          <div key={idx} className="text-sm text-gray-800 dark:text-gray-100">
                            <div className="font-semibold">{ex.nome || "—"}</div>
                            <div className="text-[13px] text-gray-700 dark:text-gray-300">
                              Serie: {ex.serie || "—"}, Rip: {ex.ripetizioni || "—"}, Kg: {ex.peso || "—"}, Rec: {ex.recupero || "—"}
                            </div>
                            {ex.note && ex.note.trim() !== "" ? (
                              <div className="text-[12px] text-gray-600 dark:text-gray-400 italic">{ex.note}</div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">Nessun esercizio inserito</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setShowPreview(false)}
              className="px-5 py-3 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-gray-700 dark:text-indigo-300 dark:hover:bg-gray-800"
            >
              Torna alla modifica
            </button>
            <Html2CanvasExportButton
              getTarget={() => exportRef.current}
              filename="scheda-allenamento.png"
              scale={2}
              label="Scarica PNG"
            />
            <button
              onClick={() => handleSaveToDb(resolvedCustomerIdForPreview)}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!resolvedCustomerIdForPreview}
              data-customer-id={resolvedCustomerIdForPreview ?? ""}
              title={
                resolvedCustomerIdForPreview
                  ? "Salva scheda"
                  : "Seleziona un cliente esistente (o assicurati che l’utente abbia un customer)"
              }
            >
              Salva scheda
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
