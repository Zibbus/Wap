import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import html2canvas from "html2canvas";

type Esercizio = {
  nome: string;
  serie: string;
  ripetizioni: string;
  recupero: string;
  // in futuro: peso (kg) per esercizi che lo richiedono
};

type GiornoAllenamento = {
  giorno: number;
  gruppi: string[];
  esercizi: Esercizio[];
  gruppiConfermati: boolean;
};

export default function WorkoutPage() {
  const [modalita, setModalita] = useState<"iniziale" | "allenamento" | "nutrizione">("iniziale");
  const [giorni, setGiorni] = useState<number | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [giorniAllenamento, setGiorniAllenamento] = useState<GiornoAllenamento[]>([]);
  const [mostraEsercizi, setMostraEsercizi] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const previewRef = useRef<HTMLDivElement | null>(null);

  const gruppiMuscolari = ["Petto", "Dorso", "Gambe", "Spalle", "Braccia", "Addome", "Full Body"];
  const eserciziPlaceholder = ["Panca piana", "Squat", "Stacchi da terra", "Trazioni", "Addominali"];

  // helper per ottenere/creare il giorno corrente
  const getOrCreateDay = (day: number): GiornoAllenamento => {
    const found = giorniAllenamento.find((g) => g.giorno === day);
    if (found) return found;
    const fresh: GiornoAllenamento = { giorno: day, gruppi: [], esercizi: [], gruppiConfermati: false };
    setGiorniAllenamento((prev) => [...prev, fresh]);
    return fresh;
  };
  const giornoCorrente = getOrCreateDay(currentDay);

  // selezione gruppi (Full Body esclusivo)
  const handleSelezionaGruppo = (gruppo: string) => {
    setGiorniAllenamento((prev) =>
      prev.map((g) => {
        if (g.giorno !== currentDay) return g;
        let nuoviGruppi = [...g.gruppi];
        if (gruppo === "Full Body") {
          nuoviGruppi = ["Full Body"];
        } else {
          if (nuoviGruppi.includes("Full Body")) return g;
          if (nuoviGruppi.includes(gruppo)) nuoviGruppi = nuoviGruppi.filter((x) => x !== gruppo);
          else nuoviGruppi.push(gruppo);
        }
        return { ...g, gruppi: nuoviGruppi };
      })
    );
  };

  const handleConfermaGruppi = () => {
    if (!giornoCorrente.gruppi.length) return;
    setGiorniAllenamento((prev) =>
      prev.map((g) => (g.giorno === currentDay ? { ...g, gruppiConfermati: true } : g))
    );
    setMostraEsercizi(true);
  };

  const handleCambiaGruppo = () => {
    if (!confirm("Cambiando i gruppi di questo giorno, gli esercizi inseriti verranno eliminati. Continuare?")) return;
    setGiorniAllenamento((prev) =>
      prev.map((g) =>
        g.giorno === currentDay ? { ...g, gruppi: [], esercizi: [], gruppiConfermati: false } : g
      )
    );
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
      // 1) cattura anteprima
      if (!previewRef.current) return;
      const canvas = await html2canvas(previewRef.current, { backgroundColor: "#ffffff", scale: 2 });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92); // "data:image/jpeg;base64,...."
      const base64Image = dataUrl.split(",")[1];

      // 2) payload da salvare (esempio)
      const payload = {
        userId: 123, // <-- Sostituisci con l'ID utente autenticato
        title: "Scheda Allenamento",
        days: giorni,
        plan: giorniAllenamento, // JSON completo
        previewImageBase64: base64Image, // opzionale: puoi salvare su storage esterno e mettere solo l'URL
      };

      // 3) chiamata API backend
      const res = await fetch("/api/workout-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer REPLACE_WITH_TOKEN" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Errore salvataggio: ${res.status}`);
      alert("Piano salvato con successo!");
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
            className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl w-full"
          >
            {/* Nutrizione */}
            <div
              onClick={() => setModalita("nutrizione")}
              className="relative h-[600px] rounded-3xl overflow-hidden group cursor-pointer shadow-lg"
            >
              <img
                src="https://images.unsplash.com/photo-1601050690597-1a3c4d99d6b2?auto=format&fit=crop&w=700&q=80"
                alt="Scheda nutrizionale"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 blur-[1px]"
              />
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white px-6 text-center">
                <h2 className="text-3xl font-bold mb-3">Vuoi creare la tua scheda nutrizionale?</h2>
                <p className="max-w-md text-gray-200">
                  Genera un piano alimentare personalizzato per i tuoi obiettivi di salute e forma fisica.
                </p>
              </div>
            </div>

            {/* Allenamento */}
            <div
              onClick={() => setModalita("allenamento")}
              className="relative h-[600px] rounded-3xl overflow-hidden group cursor-pointer shadow-lg"
            >
              <img
                src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=700&q=80"
                alt="Scheda allenamento"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 blur-[1px]"
              />
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white px-6 text-center">
                <h2 className="text-3xl font-bold mb-3">Vuoi creare la tua scheda di allenamento?</h2>
                <p className="max-w-md text-gray-200">
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
                  const selezionato = giornoCorrente.gruppi.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => handleSelezionaGruppo(g)}
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
              {giornoCorrente.gruppi.length > 0 && (
                <button
                  onClick={handleConfermaGruppi}
                  className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all"
                >
                  Conferma gruppi del giorno
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between w-full mb-4">
                <h3 className="text-xl font-bold text-indigo-700">Esercizi — Giorno {currentDay}</h3>
                <button onClick={handleCambiaGruppo} className="text-indigo-700 hover:underline">
                  Modifica gruppi
                </button>
              </div>

              {giornoCorrente.esercizi.map((ex, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-center gap-3 mb-3 bg-indigo-50 p-3 rounded-lg">
                  <select
                    className="flex-1 p-2 rounded-md border border-indigo-200"
                    value={ex.nome}
                    onChange={(e) => handleAggiornaEsercizio(i, "nome", e.target.value)}
                  >
                    <option value="">Seleziona esercizio</option>
                    {eserciziPlaceholder.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
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
                    <span className="font-semibold text-indigo-700">{g?.gruppi.length ? g.gruppi.join(", ") : "-"}</span>
                    {g?.gruppiConfermati ? (
                      <span className="ml-2 text-xs text-green-700">
                        (confermato{eserciziCount ? `, ${eserciziCount} esercizi` : ""})
                      </span>
                    ) : null}
                  </div>
                );
              })}
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

          {/* wrapper fisso per cattura immagine */}
          <div ref={previewRef} className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">Piano settimanale</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {Array.from({ length: giorni ?? 0 }).map((_, i) => {
                const g = giorniAllenamento.find((x) => x.giorno === i + 1);
                return (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">Giorno {i + 1}</h4>
                      <span className="text-sm text-gray-500">
                        {g?.gruppi?.length ? g.gruppi.join(", ") : "—"}
                      </span>
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
