// src/export/ExportWorkoutPreview.tsx
import { forwardRef, useImperativeHandle, useRef } from "react";

// Tipi item esercizio esportato (righe)
export type ExportWorkoutItem = {
  name: string;
  serie?: string | null;
  ripetizioni?: string | null;
  recupero?: string | null;
  peso?: string | null;
  note?: string | null;
};

// Metadati testata export (scadenza/goal/logo/intestatari)
export type ExportWorkoutMeta = {
  expire: string;
  goal: "peso_costante" | "perdita_peso" | "aumento_peso";
  logoPath?: string;
  ownerName?: string;
  professionalName?: string;
  creator?: string;
};

// Struttura giorno esportato (gruppi + lista esercizi)
export type ExportWorkoutDay = {
  label: string;
  groups: string[];
  items: Array<{
    name: string;
    serie: string;
    ripetizioni: string;
    recupero: string;
    peso?: string;
    note?: string;
  }>;
};

// Props del componente di export
type Props = {
  meta: ExportWorkoutMeta;
  days: ExportWorkoutDay[];
  offscreen?: boolean;
};

// Componente export “compatibile” per html2canvas (espone il nodo root via ref)
const ExportWorkoutPreview = forwardRef<HTMLElement, Props>(
  ({ meta, days, offscreen = false }, ref) => {
    // Ref interno al contenitore reale da passare a html2canvas
    const rootRef = useRef<HTMLDivElement>(null);
    // Espone rootRef all’esterno come HTMLElement
    useImperativeHandle(ref, () => rootRef.current as unknown as HTMLElement);

    // Stile base del documento (font/sfondo sicuri)
    const baseBody: React.CSSProperties = {
      margin: 0,
      padding: 0,
      background: "rgb(245,245,247)",
      color: "rgb(17,24,39)",
      fontFamily:
        'system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Liberation Sans", sans-serif',
      fontSize: "14px",
      lineHeight: "1.4",
    };

    // Contenitore pagina centrata (posizionabile offscreen)
    const page: React.CSSProperties = {
      width: "800px",
      maxWidth: "800px",
      margin: "16px auto",
      padding: "16px",
      background: "rgb(255,255,255)",
      border: "1px solid rgb(229,231,235)",
      borderRadius: "8px",
      boxSizing: "border-box",
      position: offscreen ? "absolute" : "static",
      left: offscreen ? "-10000px" : "auto",
      top: offscreen ? "0" : "auto",
      zIndex: offscreen ? 0 : "auto",
    };

    // Titolo principale (sobrio)
    const title: React.CSSProperties = {
      margin: "0 0 8px 0",
      padding: "0",
      fontSize: "22px",
      fontWeight: 700,
      color: "rgb(17,17,17)",
      textAlign: "left",
      textTransform: "none",
    };

    // Riga metadati in linea (scadenza/obiettivo)
    const metaInline: React.CSSProperties = {
      margin: "0 0 12px 0",
      padding: "0",
      fontSize: "14px",
      color: "rgb(55,65,81)",
    };

    // Spaziatura tra metadati
    const metaChunk: React.CSSProperties = {
      marginRight: "18px",
    };

    // Box di sezione per ogni giorno
    const section: React.CSSProperties = {
      margin: "12px 0 0 0",
      padding: "12px",
      border: "1px solid rgb(229,231,235)",
      borderRadius: "6px",
      background: "rgb(255,255,255)",
    };

    // Header sezione (titolo giorno + gruppi)
    const sectionHead: React.CSSProperties = {
      margin: "0 0 8px 0",
      padding: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    };

    // Titolo della sezione (giorno)
    const sectionTitle: React.CSSProperties = {
      margin: 0,
      padding: 0,
      fontSize: "16px",
      fontWeight: 700,
      color: "rgb(31,41,55)",
    };

    // Sottotitolo gruppi muscolari
    const sectionSub: React.CSSProperties = {
      margin: 0,
      padding: 0,
      fontSize: "12px",
      color: "rgb(107,114,128)",
    };

    // Riga esercizio (senza box)
    const exercise: React.CSSProperties = {
      margin: "10px 0 0 0",
      padding: "0",
    };

    // Nome esercizio
    const exerciseName: React.CSSProperties = {
      margin: "0 0 4px 0",
      padding: 0,
      fontWeight: 600,
      color: "rgb(31,41,55)",
    };

    // Dettagli serie/rip/kg/rec
    const exerciseRow: React.CSSProperties = {
      margin: 0,
      padding: 0,
      color: "rgb(55,65,81)",
    };

    // Riga note esercizio
    const note: React.CSSProperties = {
      margin: "4px 0 0 0",
      padding: 0,
      fontSize: "12px",
      color: "rgb(75,85,99)",
    };

    // Helper per mostrare trattino quando vuoto
    const small = (v?: string | null) => (v && String(v).trim() !== "" ? v : "—");

    // Etichetta leggibile obiettivo
    const goalLabel =
      meta.goal === "peso_costante"
        ? "Peso costante"
        : meta.goal === "perdita_peso"
        ? "Perdita peso"
        : meta.goal === "aumento_peso"
        ? "Aumento peso"
        : "—";

    // Render del layout stampabile/esportabile
    return (
      <div style={baseBody}>
        <div ref={rootRef} id="export-safe-root" style={page}>
          {/* Logo opzionale (posizionato in alto a destra) */}
          {meta.logoPath ? (
            <div style={{ position: "relative", height: "0px" }}>
              <img
                src={meta.logoPath}
                alt="Logo"
                crossOrigin="anonymous"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "-8px",
                  width: "64px",
                  height: "64px",
                }}
              />
            </div>
          ) : null}

          {/* Titolo documento con eventuale intestatario */}
          <h1 style={title}>
            Scheda allenamento{meta.ownerName ? ` di: ${meta.ownerName}` : ""}
          </h1>

          {/* Firma professionista (se presente) */}
          {meta.professionalName ? (
            <div style={{ margin: "0 0 8px 0", padding: 0, fontSize: "14px", color: "rgb(75,85,99)" }}>
              <em>curata da: {meta.professionalName}</em>
            </div>
          ) : null}

          {/* Metadati sintetici (scadenza/obiettivo) */}
          <div style={metaInline}>
            <span style={metaChunk}>
              <strong>Scadenza:</strong> {small(meta.expire)}
            </span>
            <span>
              <strong>Obiettivo:</strong> {goalLabel}
            </span>
          </div>

          {/* Sezioni per ogni giorno */}
          {days.map((day, idx) => (
            <div key={idx} style={section}>
              <div style={sectionHead}>
                <div style={sectionTitle}>{day.label}</div>
                <div style={sectionSub}>
                  {day.groups && day.groups.length ? day.groups.join(", ") : "—"}
                </div>
              </div>

              {day.items && day.items.length ? (
                <div>
                  {day.items.map((it, i) => (
                    <div key={i} style={exercise}>
                      <div style={exerciseName}>{small(it.name)}</div>
                      <div style={exerciseRow}>
                        Serie: {small(it.serie)} • Ripetizioni: {small(it.ripetizioni)} • Kg:{" "}
                        {small(it.peso ?? null)} • Rec: {small(it.recupero)}
                      </div>
                      {it.note && it.note.trim() !== "" ? (
                        <div style={note}>Note: {it.note}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "14px", color: "rgb(156,163,175)" }}>
                  Nessun esercizio inserito
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default ExportWorkoutPreview;
