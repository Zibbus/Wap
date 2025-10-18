import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import html2canvas from "html2canvas";
import MyFitLogo from "/src/assets/IconaMyFit.png";

type Esercizio = {
  nome: string;
  serie: string;
  ripetizioni: string;
  recupero: string;
};

type GiornoAllenamento = {
  giorno: number;
  gruppi: string[];
  esercizi: Esercizio[];
  gruppiConfermati: boolean;
};

type Goal = "peso_costante" | "perdita_peso" | "aumento_peso";

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

  const previewRef = useRef<HTMLDivElement | null>(null);

  const gruppiMuscolari = ["Petto", "Dorso", "Gambe", "Spalle", "Braccia", "Addome", "Full Body"];

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
    }
  }, [giorni]);


  // Inizializza i giorni quando l’utente sceglie il numero (evita setState in render)
  useEffect(() => {
    const d = giorniAllenamento.find((g) => g.giorno === currentDay);
    if (!d || !d.gruppiConfermati || !d.gruppi.length) return;

    (async () => {
      try {
        setLoadingEx(true);
        const data = await fetchExercisesForGroups(d.gruppi);
        setAvailableExercises(data); // solo opzioni per la tendina
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEx(false);
      }
    })();
  }, [currentDay, giorniAllenamento]);



  const giornoCorrente = giorniAllenamento.find((g) => g.giorno === currentDay);

  const GROUP_NAME_TO_ID: Record<string, number> = {
    Spalle: 1,
    Dorso: 2,
    Gambe: 3,
    Petto: 4,
    Braccia: 5,
    Addome: 6,
  };

  const ID_TO_GROUP_NAME = Object.fromEntries(
    Object.entries(GROUP_NAME_TO_ID).map(([k, v]) => [v, k])
  );

  type DBExercise = {
    id: number;
    name: string;
    musclegroups_id: number;
    groupLabel: string;           // es. "Braccia"
    defaultSerie?: string;
    defaultRipetizioni?: string;
    defaultRecupero?: string;
  };

  const namesToGroupIds = (names: string[]) => {
    const expanded = names.includes("Full Body")
      ? Array.from(new Set([...names, ...Object.keys(GROUP_NAME_TO_ID)]))
      : names;
    return Array.from(
      new Set(expanded.map(n => GROUP_NAME_TO_ID[n]).filter(Boolean))
    );
  };

  const fetchExercisesForGroups = async (groupNames: string[]): Promise<DBExercise[]> => {
    const ids = namesToGroupIds(groupNames);
    if (!ids.length) return [];

    // /api/exercises?groupIds=3&groupIds=6
    const qs = ids.map(id => `groupIds=${encodeURIComponent(String(id))}`).join("&");
    const res = await fetch(`/api/exercises?${qs}`);
    if (!res.ok) throw new Error(`Errore fetch esercizi: ${res.status}`);

    const raw = await res.json() as { id:number; title:string; musclegroups_id:number }[];

    return raw.map(r => ({
      id: r.id,
      name: r.title,
      musclegroups_id: r.musclegroups_id,
      groupLabel: ID_TO_GROUP_NAME[r.musclegroups_id] || String(r.musclegroups_id),
    }));
  };

  // Selezione gruppi (Total Body esclusivo con sostituzione corretta)
  const handleSelezionaGruppo = (gruppo: string) => {
    setGiorniAllenamento((prev) =>
      prev.map((g) => {
        if (g.giorno !== currentDay) return g;

        // se gruppi già confermati, non permettere cambio senza passare da "Modifica gruppi"
        if (g.gruppiConfermati) return g;

        let nuoviGruppi = [...g.gruppi];

        if (gruppo === "Full Body") {
          // clic su Full Body -> esclude tutto il resto
          nuoviGruppi = ["Full Body"];
        } else {  
          // clic su un gruppo "muscolare"
          if (nuoviGruppi.includes("Full Body")) {
            // se c'era Full Body, rimuovilo e metti il nuovo
            nuoviGruppi = [gruppo];
          } else {
            // toggle: aggiungi o rimuovi
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

  const handleConfermaGruppi = async () => {
    if (!giornoCorrente || !giornoCorrente.gruppi.length) return;

    try {
      setLoadingEx(true);
      const data = await fetchExercisesForGroups(giornoCorrente.gruppi);
      setAvailableExercises(data);

      // Conferma i gruppi ma NON toccare g.esercizi
      setGiorniAllenamento(prev =>
        prev.map(g =>
          g.giorno === currentDay ? { ...g, gruppiConfermati: true } : g
        )
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
    setAvailableExercises([]);
    setMostraEsercizi(false);
  };

  const handleSwitchDay = (num: number) => {
    setCurrentDay(num);
    const d = giorniAllenamento.find((g) => g.giorno === num);
    setMostraEsercizi(!!d?.gruppiConfermati);
  };

  const handleAggiungiEsercizio = () => {
    setGiorniAllenamento((prev) =>
      prev.map((g) =>
        g.giorno === currentDay
          ? { ...g, esercizi: [...g.esercizi, { nome: "", serie: "", ripetizioni: "", recupero: "" }] }
          : g
      )
    );
  };

  const handleAggiornaEsercizio = (index: number, field: keyof Esercizio, value: string) => {
    if (field === "nome" && value === "") return; // non permettere di reimpostare il placeholder
    setGiorniAllenamento((prev) =>
      prev.map((g) =>
        g.giorno === currentDay
          ? { ...g, esercizi: g.esercizi.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)) }
          : g
      )
    );
  };


  // --- Anteprima, Download JPEG, Salvataggio DB ---
  const handleGoToPreview = () => {
    setShowPreview(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadJPEG = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { backgroundColor: "#ffffff", scale: 2 });
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "scheda-allenamento.jpg";
    link.click();
  };

    const handleSaveToDb = async () => {
      try {
        if (!previewRef.current) return;

        const canvas = await html2canvas(previewRef.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const base64Image = dataUrl.split(",")[1];

        // 1) Salva il piano
        const planPayload = {
          userId: 123, // TODO: ID reale utente
          title: "Scheda Allenamento",
          days: giorni,
          plan: giorniAllenamento,
          previewImageBase64: base64Image,
        };

        const planRes = await fetch("/api/workout-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer REPLACE_WITH_TOKEN" },
          body: JSON.stringify(planPayload),
        });
        if (!planRes.ok) throw new Error(`Errore salvataggio piano: ${planRes.status}`);
        /* const planData = await planRes.json(); */ // mi aspetto { id: number, ... }

        // 2) Salva la schedule (expire + goal). Il timestamp lo mette il DB (DEFAULT CURRENT_TIMESTAMP).
        const schedulePayload = {
          userId: 123,                         // TODO: ID reale utente
          expire: expireDate,                  // "YYYY-MM-DD" da <input type="date">
          goal: goal as Goal,                  // "peso_costante" | "perdita_peso" | "aumento_peso"
          // planId: planData?.id,             // <-- decommenta se vuoi relazionare schedule al piano
        };

        const schedRes = await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer REPLACE_WITH_TOKEN" },
          body: JSON.stringify(schedulePayload),
        });
        if (!schedRes.ok) throw new Error(`Errore salvataggio schedule: ${schedRes.status}`);

        alert("Piano e schedule salvati con successo!");
      } catch (err: any) {
        console.error(err);
        alert("Si è verificato un errore durante il salvataggio.");
      }
    };


  return (
    <div className="min-h-screen flex flex-col items-center bg-indigo-50 px-8 py-12">
      {/* --- Sezione iniziale --- */}
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

      {/* --- Step giorni --- */}
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

      {/* --- Wizard giorni/esercizi --- */}
      {modalita === "allenamento" && giorni !== null && !showPreview && (
        <motion.div
          key="wizard"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-5xl mt-10 flex flex-col items-center"
        >
          {/* pulsanti Giorni */}
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
                {gruppiMuscolari.map((g) => {
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

              {/* Banner di caricamento esercizi */}
              {loadingEx && (
                <div className="w-full mb-3 text-sm text-indigo-700">
                  Caricamento esercizi dal database…
                </div>
              )}

              {/* Righe esercizi */}
              {giornoCorrente?.esercizi.map((ex, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-center gap-3 mb-3 bg-indigo-50 p-3 rounded-lg">
                  <select
                    className="w-56 sm:w-64 md:w-72 p-2 rounded-md border border-indigo-200"
                    value={ex.nome || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") return; // evita di tornare al placeholder
                      handleAggiornaEsercizio(i, "nome", v);
                    }}
                  >
                    <option value="" disabled hidden>Seleziona esercizio</option>

                    {/* optgroup per gruppi */}
                    {namesToGroupIds(giornoCorrente?.gruppi ?? []).map((gid) => {
                      const items = availableExercises.filter(opt => opt.musclegroups_id === gid);
                      if (!items.length) return null;
                      return (
                        <optgroup key={gid} label={ID_TO_GROUP_NAME[gid] ?? `Gruppo ${gid}`}>
                          {items.map(opt => (
                            <option key={opt.id} value={opt.name}>
                              {opt.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                  <input
                    type="number"
                    placeholder="Serie"
                    className="w-24 p-2 rounded-md border border-indigo-200"
                    value={ex.serie}
                    onChange={(e) => handleAggiornaEsercizio(i, "serie", e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Ripetizioni"
                    className="w-28 p-2 rounded-md border border-indigo-200"
                    value={ex.ripetizioni}
                    onChange={(e) => handleAggiornaEsercizio(i, "ripetizioni", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Recupero (s)"
                    className="w-28 p-2 rounded-md border border-indigo-200"
                    value={ex.recupero}
                    onChange={(e) => handleAggiornaEsercizio(i, "recupero", e.target.value)}
                  />
                </div>
              ))}


              <button
                onClick={handleAggiungiEsercizio}
                className="mt-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                <PlusCircle className="w-5 h-5" />
                Aggiungi esercizio
              </button>
            </>
          )}

          {/* riepilogo + anteprima */}
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

            {/* —— FORM: scadenza + obiettivo —— */}
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
                    className="p-2 rounded-md border border-indigo-200 bg-white"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as Goal)}
                  >
                    <option value="" disabled hidden>Seleziona obiettivo</option>
                    <option value="peso_costante">Peso costante</option>
                    <option value="perdita_peso">Perdita peso</option>
                    <option value="aumento_peso">Aumento peso</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-indigo-600 mt-3">
                La scadenza indica fino a quando seguire questa scheda. L’obiettivo verrà salvato nella tua schedule.
              </p>
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
      
      

      {/* --- ANTEPRIMA --- */}
      {showPreview && (
        <motion.div
          key="preview"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-5xl mt-6"
        >
          <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Anteprima scheda allenamento</h2>

          {/* IMPORTANTE: relative per posizionamenti assoluti */}
          <div ref={previewRef} className="relative bg-white p-6 rounded-xl border border-gray-200">
            {/* ===== HEADER ===== */}
            <div className="relative h-28 mb-4">
              {/* Spazio bianco in alto a sinistra */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-white rounded-md" />

              {/* Titolo in basso a sinistra (dentro l’header) */}
              <h3 className="absolute bottom-2 left-0 text-xl font-semibold">
                Piano settimanale
              </h3>

              {/* Logo MyFit in alto a destra */}
              <img
                src={MyFitLogo}
                alt="MyFit"
                className="absolute top-0 right-0 w-24 h-24 object-contain pointer-events-none select-none"
                loading="eager"
                crossOrigin="anonymous"
              />
            </div>
            {/* ===== /HEADER ===== */}

            {/* Contenuto della scheda */}
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
              onClick={handleDownloadJPEG}
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Scarica JPEG
            </button>
            <button
              onClick={handleSaveToDb}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Salva su DB
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
}
