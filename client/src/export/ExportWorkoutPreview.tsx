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
  logoPath?: string;

  /** Nome dell’intestatario (titolo “Scheda Allenamento di: …”) */
  ownerName?: string;

  /** Nome del professionista (riga “curata da: …”) */
  professionalName?: string;

  /** Legacy (non più mostrato, ma tenuto per compatibilità) */
  creator?: string;
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
 * Vista "safe" per html2canvas: solo inline style, layout semplice.
 */
const ExportWorkoutPreview = forwardRef<HTMLElement, Props>(function ExportWorkoutPreview(
  { offscreen = false, meta, days },
  ref
) {
  const wrapStyle: React.CSSProperties = offscreen
    ? { position: "fixed", left: -100000, top: 0, width: 1100 }
    : { width: 1100, margin: "0 auto" };

  const cardStyle: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    background: "#ffffff",
  };

  const small = (v?: string | null) => (v && String(v).trim() !== "" ? v : "—");

  const goalLabel =
    meta?.goal === "peso_costante"
      ? "Peso costante"
      : meta?.goal === "perdita_peso"
      ? "Perdita peso"
      : meta?.goal === "aumento_peso"
      ? "Aumento peso"
      : "—";

  return (
    <section
      ref={ref}
      data-export-workout
      style={{
        ...wrapStyle,
        position: "relative",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,Apple Color Emoji,Segoe UI Emoji",
        background: "#ffffff",
        color: "#111827",
        padding: 24,
      }}
    >
      {/* Logo in alto a destra (senza intestatario) */}
      {meta.logoPath && (
        <img
          src={meta.logoPath}
          alt="Logo"
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            width: 88,
            height: 88,
            objectFit: "contain",
          }}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 12, paddingRight: 120 /* evita sovrapposizione col logo */ }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#334155" }}>
          Scheda Allenamento{meta.ownerName ? ` di: ${meta.ownerName}` : ""}
        </h1>
        {meta.professionalName ? (
          <div style={{ fontSize: 14, color: "#4b5563", marginTop: 4 }}>
            <em>curata da: {meta.professionalName}</em>
          </div>
        ) : null}
        <div style={{ fontSize: 14, color: "#374151", marginTop: 6 }}>
          <span style={{ marginRight: 18 }}>
            <strong>Scadenza:</strong> {small(meta?.expire ?? null)}
          </span>
          <span>
            <strong>Obiettivo:</strong> {goalLabel}
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

            {/* Esercizi (no bullets) */}
            {day.items && day.items.length ? (
              <div style={{ marginTop: 10 }}>
                {day.items.map((it, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 14,
                      lineHeight: 1.35,
                      marginBottom: 12,
                    }}
                  >
                    {/* Riga 1: NOME (su riga dedicata) */}
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      {small(it.name)}
                    </div>

                    {/* Riga 2: DETTAGLI */}
                    <div>
                      Serie: {small(it.serie ?? null)},{" "}
                      Ripetizioni: {small(it.ripetizioni ?? null)},{" "}
                      Kg: {small(it.peso ?? null)},{" "}
                      Rec: {small(it.recupero ?? null)}
                    </div>

                    {/* Riga 3: NOTA (se presente) */}
                    {it.note && it.note.trim() !== "" ? (
                      <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>
                        Note: {it.note}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
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
