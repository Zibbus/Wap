// src/export/ExportWorkoutPreview.tsx
import React, { forwardRef } from "react";

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
  creator?: string;
  logoPath?: string;
};

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

type Props = {
  offscreen?: boolean;
  meta: ExportWorkoutMeta;
  days: ExportWorkoutDay[];
};

/**
 * Vista "safe" per html2canvas:
 * - NIENTE Tailwind (solo inline style -> evita oklch/var())
 * - Layout semplice a singola colonna
 * - Background bianco, testi scuri
 */
const ExportWorkoutPreview = forwardRef<HTMLElement, Props>(function ExportWorkoutPreview(
  { offscreen = false, meta, days },
  ref
) {
  const wrapStyle: React.CSSProperties = offscreen
    ? { position: "fixed", left: -100000, top: 0, width: 1100 } // lontano dallo schermo
    : { width: 1100, margin: "0 auto" };

  const cardStyle: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    background: "#ffffff",
  };

  const small = (v?: string | null) => (v && String(v).trim() !== "" ? v : "—");

  return (
    <section
      ref={ref}
      // data-hook per l'export
      data-export-workout
      style={{
        ...wrapStyle,
        fontFamily:
          "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,Apple Color Emoji,Segoe UI Emoji",
        background: "#ffffff",
        color: "#111827",
        padding: 24,
      }}
    >
      {/* Header */}
      {meta.logoPath && (
        <img
            src={meta.logoPath}
            alt="Logo"
            className="absolute top-0 right-0 w-24 h-24 object-contain pointer-events-none select-none"
            crossOrigin="anonymous"
        />
        )}
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#334155" }}>
          Scheda Allenamento
        </h1>
        <div style={{ fontSize: 14, color: "#374151", marginTop: 6 }}>
          <span style={{ marginRight: 18 }}>
            <strong>Scadenza:</strong> {small(meta?.expire ?? null)}
          </span>
          <span>
            <strong>Obiettivo:</strong>{" "}
            {meta?.goal === "peso_costante"
              ? "Peso costante"
              : meta?.goal === "perdita_peso"
              ? "Perdita peso"
              : meta?.goal === "aumento_peso"
              ? "Aumento peso"
              : "—"}
          </span>
        </div>
      </div>

      {/* Giorni */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {days.map((day, idx) => (
          <div key={idx} style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                {day.label}
              </h3>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {day.groups && day.groups.length ? day.groups.join(", ") : "—"}
              </div>
            </div>

            {day.items && day.items.length ? (
              <ul style={{ listStyle: "disc", paddingLeft: 18, margin: 0 }}>
                {day.items.map((it, i) => (
                  <li key={i} style={{ fontSize: 14, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{small(it.name)}</span>
                    {" • "}
                    <span>Serie: {small(it.serie ?? null)}</span>
                    {" • "}
                    <span>Ripetizioni: {small(it.ripetizioni ?? null)}</span>
                    {" • "}
                    <span>Recupero: {small(it.recupero ?? null)}</span>
                    {it.peso && it.peso.trim() !== "" ? (
                      <>
                        {" • "}
                        <span>Peso: {it.peso} kg</span>
                      </>
                    ) : null}
                    {it.note && it.note.trim() !== "" ? (
                      <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>
                        Note: {it.note}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: 14, color: "#9ca3af" }}>Nessun esercizio inserito</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
});

export default ExportWorkoutPreview;
