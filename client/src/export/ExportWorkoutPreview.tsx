// src/export/ExportWorkoutPreview.tsx
import { forwardRef, useImperativeHandle, useRef } from "react";

export type ExportWorkoutItem = {
  name: string;
  serie?: string | null;
  ripetizioni?: string | null;
  recupero?: string | null; // in secondi (string)
  peso?: string | null;     // kg (string)
  note?: string | null;
};

export type ExportWorkoutMeta = {
  expire: string;
  goal: "peso_costante" | "perdita_peso" | "aumento_peso";
  logoPath?: string;            // opzionale (non usiamo object-fit)
  ownerName?: string;           // “Scheda Allenamento di: …”
  professionalName?: string;    // “curata da: …”
  creator?: string;             // legacy (non usato ma tenuto per compatibilità)
};

export type ExportWorkoutDay = {
  label: string;        // es. "Giorno 1"
  groups: string[];     // es. ["Petto","Spalle"]
  items: Array<{
    name: string;
    serie: string;
    ripetizioni: string;
    recupero: string;
    peso?: string;
    note?: string;
  }>;
};

type Props = {
  meta: ExportWorkoutMeta;
  days: ExportWorkoutDay[];
  offscreen?: boolean;
};

const ExportWorkoutPreview = forwardRef<HTMLElement, Props>(
  ({ meta, days, offscreen = false }, ref) => {
    const rootRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => rootRef.current as unknown as HTMLElement);

    // ====== STILI “SAFE” (solo proprietà supportate) ======
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

    const headerRow: React.CSSProperties = {
      margin: "0 0 12px 0",
      padding: "0",
    };

    const title: React.CSSProperties = {
      margin: "0 0 8px 0",
      padding: "0",
      fontSize: "22px",
      fontWeight: 700,
      color: "rgb(49,46,129)",
      textAlign: "left",
      textTransform: "none",
    };

    const metaBox: React.CSSProperties = {
      margin: "0 0 12px 0",
      padding: "8px",
      background: "rgb(238,242,255)",
      border: "1px solid rgb(219,234,254)",
      borderRadius: "6px",
      boxSizing: "border-box",
    };

    const row: React.CSSProperties = {
      margin: "0 0 4px 0",
      padding: "0",
      whiteSpace: "normal",
      wordWrap: "break-word",
      wordBreak: "break-word",
      overflowWrap: "anywhere",
    };

    const section: React.CSSProperties = {
      margin: "12px 0 0 0",
      padding: "12px",
      border: "1px solid rgb(229,231,235)",
      borderRadius: "6px",
      background: "rgb(255,255,255)",
    };

    const sectionHead: React.CSSProperties = {
      margin: "0 0 8px 0",
      padding: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    };

    const sectionTitle: React.CSSProperties = {
      margin: 0,
      padding: 0,
      fontSize: "16px",
      fontWeight: 700,
      color: "rgb(31,41,55)",
    };

    const sectionSub: React.CSSProperties = {
      margin: 0,
      padding: 0,
      fontSize: "12px",
      color: "rgb(107,114,128)",
    };

    const exercise: React.CSSProperties = {
      margin: "10px 0 0 0",
      padding: "8px",
      border: "1px solid rgb(229,231,235)",
      borderRadius: "4px",
      background: "rgb(255,255,255)",
    };

    const exerciseName: React.CSSProperties = {
      margin: "0 0 4px 0",
      padding: 0,
      fontWeight: 600,
      color: "rgb(31,41,55)",
    };

    const exerciseRow: React.CSSProperties = {
      margin: 0,
      padding: 0,
      color: "rgb(55,65,81)",
    };

    const note: React.CSSProperties = {
      margin: "4px 0 0 0",
      padding: 0,
      fontSize: "12px",
      color: "rgb(75,85,99)",
    };

    const small = (v?: string | null) => (v && String(v).trim() !== "" ? v : "—");

    const goalLabel =
      meta.goal === "peso_costante"
        ? "Peso costante"
        : meta.goal === "perdita_peso"
        ? "Perdita peso"
        : meta.goal === "aumento_peso"
        ? "Aumento peso"
        : "—";

    return (
      <div style={baseBody}>
        <div ref={rootRef} id="export-safe-root" style={page}>
          {/* LOGO opzionale (niente object-fit) */}
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

          {/* Header */}
          <div style={headerRow}>
            <h1 style={title}>
              Anteprima scheda allenamento (compatibile)
              {meta.ownerName ? ` — di: ${meta.ownerName}` : ""}
            </h1>
            {meta.professionalName ? (
              <div style={{ margin: "0 0 8px 0", padding: 0, fontSize: "14px", color: "rgb(75,85,99)" }}>
                <em>curata da: {meta.professionalName}</em>
              </div>
            ) : null}

            <div style={metaBox}>
              <div style={row}>
                <strong>Scadenza:</strong> {small(meta.expire)}
              </div>
              <div style={row}>
                <strong>Obiettivo:</strong> {goalLabel}
              </div>
            </div>
          </div>

          {/* Giorni */}
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
