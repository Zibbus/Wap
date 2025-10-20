import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

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

type Goal = "peso_costante" | "perdita_peso" | "aumento_peso";

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
        className="w-56 sm:w-60 p-2 rounded-md border border-indigo-200 bg-white"
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
        <div className="absolute z-30 mt-1 w-56 max-h-64 overflow-auto bg-white border border-indigo-200 rounded-md shadow">
          {grouped.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">Nessun risultato</div>
          ) : (
            grouped.map((g) => (
              <div key={g.gid} className="py-1">
                <div className="px-3 py-1 text-xs font-semibold text-indigo-600 sticky top-0 bg-white/95">
                  {g.label}
                </div>
                {g.items.map((opt) => {
                  const idx = flatList.findIndex((x) => x.id === opt.id);
                  const active = idx === safeActiveIdx;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 ${active ? "bg-indigo-50" : ""}`}
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
  const [modalita, setModalita] = useState<"iniziale" | "allenamento" | "nutrizione">("iniziale");
  const [giorni, setGiorni] = useState<number | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [giorniAllenamento, setGiorniAllenamento] = useState<GiornoAllenamento[]>([]);
  const [mostraEsercizi, setMostraEsercizi] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [expireDate, setExpireDate] = useState<string>("");
  const [goal, setGoal] = useState<Goal | "">("");

  const [loadingEx, setLoadingEx] = useState<boolean>(false);
  const [availableExercises, setAvailableExercises] = useState<DBExercise[]>([]);
  const [availableByDay, setAvailableByDay] = useState<Record<number, DBExercise[]>>({}); // ✅ cache per giorno

  const previewRef = useRef<HTMLDivElement | null>(null);

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

    const qs = ids.map((id) => `groupIds=${encodeURIComponent(String(id))}`).join("&");
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

  // ✅ Fetch unico e cache per giorno
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
    // svuoto la cache di quel giorno
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
    // usa la cache se esiste
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
    if (field === "nome" && value === "") return; // no placeholder
    setGiorniAllenamento((prev) =>
      prev.map((g) =>
        g.giorno === currentDay
          ? { ...g, esercizi: g.esercizi.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)) }
          : g
      )
    );
  };

  // ✅ toggle note: crea textarea con "" (placeholder visibile), rimuove completamente se clicchi di nuovo
  const handleToggleNota = (index: number) => {
    setGiorniAllenamento((prev) =>
      prev.map((g) => {
        if (g.giorno !== currentDay) return g;
        const next = g.esercizi.map((ex, i) => {
          if (i !== index) return ex;
          if (ex.note === undefined) {
            // crea il campo e mostra subito il placeholder
            return { ...ex, note: "" };
          } else {
            // rimuovi completamente il campo => textarea sparisce
            const { note, ...rest } = ex as any;
            return rest as Esercizio;
          }
        });
        return { ...g, esercizi: next };
      })
    );
  };

  /* Anteprima / Download / Salvataggio */
  const handleGoToPreview = () => {
    if (!expireDate) {
      alert("Imposta una data di scadenza prima di continuare.");
      return;
    }
    if (!goal) {
      alert("Seleziona un obiettivo tra: peso_costante, perdita_peso, aumento_peso.");
      return;
    }
    setShowPreview(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Scarica PDF multipagina A4
  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;

    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    } else {
      let remainingHeight = imgHeight;
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      remainingHeight -= pageHeight;
      position = -pageHeight;

      while (remainingHeight > 0) {
        pdf.addPage();
        position -= pageHeight;
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
      }
    }

    pdf.save("scheda-allenamento.pdf");
  };

  // Salva piano + schedule + schedule_exercise
  const handleSaveToDb = async () => {
    try {
      if (!expireDate || !goal || !giorniAllenamento.length) {
        alert("Compila tutti i campi della scheda prima di salvare.");
        return;
      }

      // 1️⃣ Crea la schedule
      const schedulePayload = {
        customer_id: 1, // TODO: ID cliente loggato
        freelancer_id: null, // oppure ID professionista se disponibile
        expire: expireDate,
        goal,
      };

      const scheduleRes = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedulePayload),
      });
      if (!scheduleRes.ok) throw new Error("Errore creazione schedule");
      const schedule = await scheduleRes.json();
      const scheduleId = schedule.id;

      // 2️⃣ Crea ogni giorno
      const dayMap: Record<number, number> = {}; // giorno -> dayId
      for (const g of giorniAllenamento) {
        const dayRes = await fetch("/api/days", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schedule_id: scheduleId, day: g.giorno }),
        });
        if (!dayRes.ok) throw new Error("Errore creazione giorno");
        const day = await dayRes.json();
        dayMap[g.giorno] = day.id;
      }

      // 3️⃣ Inserisci esercizi (bulk)
      const allExercises = giorniAllenamento.flatMap((g) =>
        g.esercizi
          .filter((ex) => ex.exerciseId)
          .map((ex, idx) => ({
            day_id: dayMap[g.giorno],
            exercise_id: ex.exerciseId!,
            position: idx + 1,
            sets: ex.serie ? parseInt(ex.serie) : null,
            reps: ex.ripetizioni ? parseInt(ex.ripetizioni) : null,
            rest_seconds: ex.recupero ? parseInt(ex.recupero) : null,
            weight_value: ex.peso ? parseFloat(ex.peso) : null,
            notes: ex.note ?? null,
          }))
      );

      const exRes = await fetch("/api/schedule-exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId, items: allExercises }),
      });
      if (!exRes.ok) throw new Error("Errore salvataggio esercizi");

      alert("✅ Scheda salvata con successo!");
    } catch (err) {
      console.error(err);
      alert("❌ Errore durante il salvataggio della scheda.");
    }
  };

  /* =========================
     Render
     ========================= */
  return (
    <div className="min-h-screen flex flex-col items-center bg-indigo-50 px-8 py-12">
      {/* Scelta iniziale */}
      <AnimatePresence>
        {modalita === "iniziale" && !showPreview && (
          <motion.div
            key="scelta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-7xl w-full"
          >
            {/* Nutrizione */}
            <div
              onClick={() => setModalita("nutrizione")}
              className="relative h-[680px] md:h-[760px] rounded-3xl overflow-hidden group cursor-pointer shadow-lg"
            >
              <img
                src="https://images.unsplash.com/photo-1601050690597-1a3c4d99d6b2?auto=format&fit=crop&w=1200&q=80"
                alt="Scheda nutrizionale"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 blur-[1px]"
              />
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white px-6 text-center">
                <h2 className="text-3xl font-bold mb-3">Vuoi creare la tua scheda nutrizionale?</h2>
                <p className="max-w-xl text-gray-200">
                  Genera un piano alimentare personalizzato per i tuoi obiettivi di salute e forma fisica.
                </p>
              </div>
            </div>

            {/* Allenamento */}
            <div
              onClick={() => setModalita("allenamento")}
              className="relative h-[680px] md:h-[760px] rounded-3xl overflow-hidden group cursor-pointer shadow-lg"
            >
              <img
                src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80"
                alt="Scheda allenamento"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 blur-[1px]"
              />
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white px-6 text-center">
                <h2 className="text-3xl font-bold mb-3">Vuoi creare la tua scheda di allenamento?</h2>
                <p className="max-w-xl text-gray-200">
                  Crea la tua scheda personalizzata scegliendo giorni e gruppi muscolari.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step: scegli giorni */}
      {modalita === "allenamento" && giorni === null && !showPreview && (
        <motion.div
          key="allenamento-giorni"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-2xl mt-10 text-center"
        >
          <h2 className="text-3xl font-bold text-indigo-700 mb-6">Quanti giorni a settimana vuoi allenarti?</h2>
          <div className="flex justify-center flex-wrap gap-5">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <button
                key={num}
                onClick={() => setGiorni(num)}
                className="w-14 h-14 rounded-full bg-indigo-100 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold transition-all shadow"
              >
                {num}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Wizard giorni/esercizi */}
      {modalita === "allenamento" && giorni !== null && !showPreview && (
        <motion.div
          key="wizard"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-5xl mt-10 flex flex-col items-center"
        >
          {/* Pulsanti Giorni */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {Array.from({ length: giorni }).map((_, i) => (
              <button
                key={i}
                onClick={() => handleSwitchDay(i + 1)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  currentDay === i + 1 ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
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
              className="p-3 rounded-full bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50"
            >
              <ChevronLeft className="w-6 h-6 text-indigo-700" />
            </button>
            <h2 className="text-2xl font-bold text-indigo-700">
              Giorno {currentDay} di {giorni}
            </h2>
            <button
              onClick={() => handleSwitchDay(Math.min(giorni, currentDay + 1))}
              disabled={currentDay === giorni}
              className="p-3 rounded-full bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50"
            >
              <ChevronRight className="w-6 h-6 text-indigo-700" />
            </button>
          </div>

          {/* selezione gruppi / esercizi */}
          {!mostraEsercizi ? (
            <>
              <p className="text-indigo-700 mb-6">Seleziona i gruppi muscolari da allenare</p>
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
                          : "bg-indigo-50 hover:bg-indigo-100 border-indigo-100 text-indigo-700"
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
                <h3 className="text-xl font-bold text-indigo-700">Esercizi — Giorno {currentDay}</h3>
                <button onClick={handleCambiaGruppo} className="text-indigo-700 hover:underline">
                  Modifica gruppi
                </button>
              </div>

              {loadingEx && <div className="w-full mb-3 text-sm text-indigo-700">Caricamento esercizi dal database…</div>}

              {/* Righe esercizi */}
              {giornoCorrente?.esercizi.map((ex, i) => {
                const selectedOpt = ex.exerciseId
                  ? availableExercises.find((o) => o.id === ex.exerciseId)
                  : availableExercises.find((o) => o.name === ex.nome);
                const requires = selectedOpt?.weightRequired ?? false;
                const needWeightButEmpty = requires && (!ex.peso || ex.peso.trim() === "");

                return (
                  <div key={i} className="flex flex-col gap-2 mb-4 bg-indigo-50 p-3 rounded-lg w-full">
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
                        className="w-20 p-2 rounded-md border border-indigo-200"
                        value={ex.serie}
                        onChange={(e) => handleAggiornaEsercizio(i, "serie", e.target.value)}
                        min={0}
                      />
                      <input
                        type="number"
                        placeholder="Rip."
                        className="w-20 p-2 rounded-md border border-indigo-200"
                        value={ex.ripetizioni}
                        onChange={(e) => handleAggiornaEsercizio(i, "ripetizioni", e.target.value)}
                        min={0}
                      />
                      <input
                        type="number"
                        placeholder="Kg"
                        className={`w-20 p-2 rounded-md border ${
                          requires ? (needWeightButEmpty ? "border-red-400" : "border-indigo-200") : "border-gray-200 opacity-50"
                        }`}
                        value={ex.peso ?? ""}
                        onChange={(e) => handleAggiornaEsercizio(i, "peso", e.target.value)}
                        disabled={!requires}
                        min={0}
                        step="0.5"
                      />
                      <input
                        type="number"
                        placeholder="Rec. (s)"
                        className="w-24 p-2 rounded-md border border-indigo-200"
                        value={ex.recupero}
                        onChange={(e) => handleAggiornaEsercizio(i, "recupero", e.target.value)}
                        min={0}
                      />

                      {/* ✅ Pulsante toggle note (apre con "", chiude rimuovendo il campo) */}
                      <button
                        type="button"
                        onClick={() => handleToggleNota(i)}
                        className="px-3 py-2 text-sm rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold"
                      >
                        {ex.note === undefined ? "Aggiungi nota" : "Rimuovi nota"}
                      </button>
                    </div>

                    {/* ✅ Textarea visibile solo se ex.note è definito */}
                    {ex.note !== undefined && (
                      <textarea
                        className="w-full mt-2 p-2 rounded-md border border-indigo-200 text-sm"
                        placeholder="Inserisci note (es. tecnica, respirazione, durata...)"
                        value={ex.note ?? ""} // "" => placeholder visibile
                        onChange={(e) => handleAggiornaEsercizio(i, "note", e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
              <button
                onClick={handleAggiungiEsercizio}
                className="mt-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                <PlusCircle className="w-5 h-5" />
                Aggiungi esercizio
              </button>
            </>
          )}

          {/* Riepilogo + form impostazioni scheda */}
          <div className="mt-10 w-full">
            <h3 className="text-lg font-semibold text-indigo-700 mb-3 text-center">Riepilogo allenamento</h3>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {Array.from({ length: giorni }).map((_, i) => {
                const g = giorniAllenamento.find((x) => x.giorno === i + 1);
                const eserciziCount = g?.esercizi.length ?? 0;
                return (
                  <div key={i} className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2 text-sm">
                    Giorno {i + 1}:{" "}
                    <span className="font-semibold text-indigo-700">
                      {g?.gruppi.length ? g.gruppi.join(", ") : "-"}
                    </span>
                    {g?.gruppiConfermati ? (
                      <span className="ml-2 text-xs text-green-700">
                        (confermato{eserciziCount ? `, ${eserciziCount} esercizi` : ""})
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Form: scadenza + obiettivo */}
            <div className="max-w-2xl mx-auto bg-indigo-50/60 border border-indigo-100 rounded-xl p-5 mb-6">
              <h4 className="text-base font-semibold text-indigo-800 mb-4">Impostazioni scheda</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm text-indigo-700 mb-1">Scadenza scheda</label>
                  <input
                    type="date"
                    className="p-2 rounded-md border border-indigo-200 bg-white"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-indigo-700 mb-1">Obiettivo</label>
                  <select
                    className="w-56 sm:w-60 p-2 rounded-md border border-indigo-200 bg-white"
                    value={goal || ""}
                    onChange={(e) => {
                      const v = e.target.value as Goal | "altro" | "";
                      if (v === "") return; // non tornare al placeholder
                      if (v === "altro") setGoal(""); // blocchiamo nel passo successivo
                      else setGoal(v);
                    }}
                  >
                    <option value="" disabled hidden>
                      Seleziona obiettivo
                    </option>
                    <option value="peso_costante">Peso costante</option>
                    <option value="perdita_peso">Perdita peso</option>
                    <option value="aumento_peso">Aumento peso</option>
                    <option value="altro">Altro…</option>
                  </select>
                  <p className="text-xs text-indigo-600 mt-2">
                    Nota: “Altro…” non è salvabile. Scegli uno dei tre obiettivi per procedere.
                  </p>
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
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-5xl mt-6"
        >
          <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Anteprima scheda allenamento</h2>

          {/* contenitore da “fotografare” */}
          <div ref={previewRef} className="relative bg-white p-6 rounded-xl border border-gray-200">
            {/* HEADER */}
            <div className="relative h-28 mb-4">
              <div className="absolute top-0 left-0 w-24 h-24 bg-white rounded-md" />
              <h3 className="absolute bottom-2 left-0 text-xl font-semibold">Piano settimanale</h3>
              <img
                src="/assets/IconaMyFit.png"
                alt="MyFit"
                className="absolute top-0 right-0 w-24 h-24 object-contain pointer-events-none select-none"
                loading="eager"
                crossOrigin="anonymous"
              />
            </div>

            {/* scheda */}
            <div className="grid md:grid-cols-2 gap-6">
              {Array.from({ length: giorni ?? 0 }).map((_, i) => {
                const g = giorniAllenamento.find((x) => x.giorno === i + 1);
                return (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">Giorno {i + 1}</h4>
                      <span className="text-sm text-gray-500">{g?.gruppi?.length ? g.gruppi.join(", ") : "—"}</span>
                    </div>
                    <div className="space-y-2">
                      {g?.esercizi?.length ? (
                        g.esercizi.map((ex, idx) => (
                          <div key={idx} className="text-sm flex flex-wrap gap-3">
                            <span className="font-medium">{ex.nome || "—"}</span>
                            <span>Serie: {ex.serie || "—"}</span>
                            <span>Ripetizioni: {ex.ripetizioni || "—"}</span>
                            <span>Recupero: {ex.recupero || "—"}</span>
                            {ex.peso && ex.peso !== "" ? <span>Peso: {ex.peso} kg</span> : null}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">Nessun esercizio inserito</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setShowPreview(false)}
              className="px-5 py-3 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              Torna alla modifica
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Scarica PDF
            </button>
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