import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, PlusCircle, Trash2 } from "lucide-react";

import logoUrl from "../assets/IconaMyFitNoBG.png";

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

function readAuthSnapshot() {
  const raw = JSON.parse(localStorage.getItem("authData") || "{}");
  const userFull = raw?.user ?? {};
  return {
    token: raw?.token ?? null,
    user: {
      id: userFull.id ?? raw?.userId ?? null,
      username: userFull.username ?? raw?.username ?? null,
      type: userFull.type ?? raw?.role ?? null,
      sex: userFull.sex ?? null,
      dob: userFull.dob ?? null,
      customer: userFull.customer ?? null,
      first_name: userFull.first_name ?? userFull.firstName ?? null,
      last_name: userFull.last_name ?? userFull.lastName ?? null,
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

function getProfessionalName(): string | undefined {
  try {
    const raw = JSON.parse(localStorage.getItem("authData") || "{}");
    const u = raw?.user || {};
    if (u?.type === "professionista") {
      const prof = u.professional || u.prof || u.freelancer || null;
      if (prof?.display_name && String(prof.display_name).trim()) return String(prof.display_name).trim();
      const full = [u.first_name || u.firstName, u.last_name || u.lastName].filter(Boolean).join(" ").trim();
      if (full) return full;
      if (u.username) return String(u.username);
    }
  } catch {}
  return undefined;
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
   Pagina
   ========================= */
export default function WorkoutPage() {
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

  const exportRef = useRef<HTMLElement | null>(null);

  // --- ADD: intestatario + consenso ---
  const { user, token } = readAuthSnapshot();
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [ownerMode, setOwnerMode] = useState<OwnerMode>("self");

  const [loadingSelf, setLoadingSelf] = useState(false);
  const [selfData, setSelfData] = useState<UserAnthro>({
    first_name: user?.first_name ?? undefined,
    last_name: user?.last_name ?? undefined,
    sex: (user?.sex as any) ?? undefined,
    dob: user?.dob ?? undefined,
    weight: user?.customer?.weight ?? null,
    height: user?.customer?.height ?? null,
  });

  const [otherPerson, setOtherPerson] = useState({
    first_name: "",
    last_name: "",
    sex: "O" as "M" | "F" | "O",
    age: "" as number | "",
    weight: "" as number | "",
    height: "" as number | "",
  });

  useEffect(() => {
    if (ownerMode !== "self" || !token) return;

    (async () => {
      try {
        setLoadingSelf(true);
        const res = await fetch("http://localhost:4000/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const me = await res.json();
          setSelfData({
            first_name: me.first_name ?? undefined,
            last_name: me.last_name ?? undefined,
            sex: (me.sex ?? undefined) as any,
            dob: me.dob ?? undefined,
            weight: me.customer?.weight ?? null,
            height: me.customer?.height ?? null,
          });
        }
      } catch (e) {
        console.error("Errore /api/me", e);
      } finally {
        setLoadingSelf(false);
      }
    })();
  }, [ownerMode, token]);


  // Inizializza i giorni quando l’utente sceglie il numero
  useEffect(() => {
    if (giorni && giorni > 0) {
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
  }, [giorni]);

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
    const res = await fetch(`http://localhost:4000/api/exercises?${qs}`);

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

  // ✅ toggle note
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

  const toIntOrNull = (val: string | undefined | null, max: number): number | null => {
    if (val === undefined || val === null || val === "") return null;
    const n = Math.floor(Number(val));
    if (!Number.isFinite(n)) return null;
    return clamp(n, 0, max);
  };

  const toWeightOrNull = (val: string | undefined | null): number | null => {
    if (val === undefined || val === null || val === "") return null;
    const n = Number(val);
    if (!Number.isFinite(n)) return null;
    const clamped = clamp(n, 0, 9999.99);
    return Math.round(clamped * 100) / 100;
  };

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
    const chk = allConfirmedDaysHaveAtLeastOneComplete();
    if (!chk.ok) {
      alert(`Completa almeno un esercizio nel Giorno ${chk.missingDay}.`);
      return;
    }

    setShowPreview(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveToDb = async () => {
    try {
      if (!expireDate || !goal || !giorniAllenamento.length) {
        alert("Compila tutti i campi della scheda prima di salvare.");
        return;
      }

      // 1) Crea la schedule
      const schedulePayload = { expire: expireDate, goal };
      const auth = JSON.parse(localStorage.getItem("authData") || "{}");
      const tokenLS = auth?.token;

      const res = await fetch("http://localhost:4000/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tokenLS ? { Authorization: `Bearer ${tokenLS}` } : {}),
        },
        body: JSON.stringify(schedulePayload),
      });

      if (!res.ok) throw new Error("Errore creazione schedule");
      const schedule = await res.json();
      const scheduleId: number = schedule.id;

      // 2) Crea i giorni e costruisci la mappa day -> day_id
      const dayMap: Record<number, number> = {};
      for (const g of giorniAllenamento) {
        const dayRes = await fetch("http://localhost:4000/api/schedules/day", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tokenLS ? { Authorization: `Bearer ${tokenLS}` } : {}),
          },
          body: JSON.stringify({ schedule_id: scheduleId, day: g.giorno }),
        });
        if (!dayRes.ok) throw new Error("Errore creazione giorno");
        const day = await dayRes.json();
        dayMap[g.giorno] = day.id as number;
      }

      // 3) Prepara gli esercizi con i cap coerenti con il DB
      const allExercises = giorniAllenamento.flatMap((g) =>
        g.esercizi
          .filter((ex) => ex.exerciseId)
          .map((ex, idx) => {
            const sets = toIntOrNull(ex.serie, 255);
            const reps = toIntOrNull(ex.ripetizioni, 255);
            const rest_seconds = toIntOrNull(ex.recupero, 65535);
            const weight_value = toWeightOrNull(ex.peso);

            return {
              day_id: dayMap[g.giorno],
              exercise_id: ex.exerciseId as number,
              position: idx + 1,
              sets,
              reps,
              rest_seconds,
              weight_value,
              notes: ex.note ?? null,
            };
          })
      );

      // 4) Salva gli esercizi (se presenti)
      if (allExercises.length) {
        const exRes = await fetch("http://localhost:4000/api/schedules/exercises", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tokenLS ? { Authorization: `Bearer ${tokenLS}` } : {}),
          },
          body: JSON.stringify({ scheduleId, items: allExercises }),
        });

        if (!exRes.ok) throw new Error("Errore salvataggio esercizi");
      }

      alert("✅ Scheda salvata con successo!");
    } catch (err: any) {
      console.error(err);
      alert("❌ Errore durante il salvataggio della scheda.");
    }
  };

  /* =========================
     Gate di consenso (liberatoria)
     ========================= */
  if (!consentAccepted) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border dark:border-gray-800">
          <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-3">
            Informativa & consenso per la scheda di allenamento
          </h2>
          <div className="text-sm text-gray-700 dark:text-gray-200 space-y-3">
            <p>
              Le indicazioni di allenamento fornite dall’app hanno finalità informative/educative e <strong>non sostituiscono</strong> il parere di un medico, fisioterapista o professionista qualificato.
            </p>
            <p>
              Valuta il tuo stato di salute prima di intraprendere qualunque programma di esercizi. In presenza di infortuni,
              patologie, gravidanza o terapie, consulta preventivamente il tuo medico.
            </p>
            <ul className="list-disc ml-5">
              <li>Interrompi immediatamente l’attività in caso di dolore, vertigini o malessere.</li>
              <li>Usa attrezzatura idonea e tecnica corretta per ridurre il rischio di infortuni.</li>
              <li>Gli autori dell’app <strong>non sono responsabili</strong> per danni o conseguenze da uso improprio.</li>
            </ul>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200"
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
      : `${otherPerson.first_name} ${otherPerson.last_name}`.trim() || "Intestatario esterno";

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
              <h4 className="text-base font-semibold text-indigo-800 dark:text-indigo-300 mb-4">Impostazioni scheda</h4>

              {/* Intestatario */}
              <div className="mb-4">
                <label className="block text-sm text-indigo-700 dark:text-indigo-300 mb-2">Intestatario</label>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={ownerMode === "self"}
                      onChange={() => setOwnerMode("self")}
                    />
                    <span>Me stesso</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={ownerMode === "other"}
                      onChange={() => setOwnerMode("other")}
                    />
                    <span>Un’altra persona</span>
                  </label>
                </div>

                {ownerMode === "self" ? (
                  <div className="mt-3 text-sm text-gray-700 dark:text-gray-200">
                    {loadingSelf ? (
                      <span>Caricamento profilo…</span>
                    ) : (
                      <div className="flex flex-wrap gap-6">
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
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4">
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

          {/* VISTA OFF-SCREEN per export: non occupa spazio */}
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              opacity: 0,            // invisibile ma layouttato correttamente
              pointerEvents: "none",
              zIndex: -1,
            }}
          >
            <ExportWorkoutPreview
              ref={exportRef}
              /* NON passare offscreen qui */
              meta={{
                expire: expireDate || "—",
                goal: goalForExport,
                logoPath: logoUrl,
                ownerName: intestatarioLabel,
                professionalName: getProfessionalName(),
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
                  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 m-0">
                    Scheda Allenamento{intestatarioLabel ? ` di: ${intestatarioLabel}` : ""}
                  </h3>
                  {getProfessionalName() && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 -mt-0.5">
                      <em>curata da: {getProfessionalName()}</em>
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
              onClick={handleSaveToDb}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Salva scheda
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
