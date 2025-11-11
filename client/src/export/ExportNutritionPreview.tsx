import { forwardRef, useImperativeHandle, useRef } from "react";

// Tipi dati per item/pasto/giorno da esportare
export type ExportMealItem = { text: string };
export type ExportMeal = { name: string; items: ExportMealItem[] };
export type ExportDay = {
  label: string; // "Giorno 1 — Lunedì"
  totals: { kcal: number; protein: number; carbs: number; fiber: number; fat: number };
  meals: ExportMeal[];
};

// Metadati di testata (scadenza, obiettivo, parametri)
export type ExportMeta = {
  expire: string;
  goal: string;
  activity: string;
  bmr?: number;
  tdee?: number;
  target?: number;
  cheats?: string;
};

// Props del componente export
export type ExportNutritionPreviewProps = {
  meta: ExportMeta;
  days: ExportDay[];
  offscreen?: boolean;
};

// Componente di anteprima “compatibile” per export PNG (forwardRef verso il nodo root)
const ExportNutritionPreview = forwardRef<HTMLElement, ExportNutritionPreviewProps>(
  ({ meta, days, offscreen = false }, ref) => {
    // ref interno al contenitore da esporre all’esterno
    const rootRef = useRef<HTMLDivElement>(null);
    // espone il nodo reale tramite il ref esterno (per html2canvas)
    useImperativeHandle(ref, () => rootRef.current as unknown as HTMLElement);

    // Stili base del “foglio” (render sicuro per html2canvas)
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

    // Contenitore pagina A4-like centrata
    const page: React.CSSProperties = {
      width: "800px",
      maxWidth: "800px",
      margin: "16px auto",
      padding: "16px",
      background: "rgb(255,255,255)",
      border: "1px solid rgb(229,231,235)",
      borderRadius: "8px",
      boxSizing: "border-box",
      position: offscreen ? "absolute" : "static", // se offscreen, sposta fuori dallo schermo
      left: offscreen ? "-10000px" : "auto",
      top: offscreen ? "0" : "auto",
      zIndex: offscreen ? 0 : "auto",
    };

    // Titolo documento
    const title: React.CSSProperties = {
      margin: "0 0 12px 0",
      padding: "0",
      fontSize: "22px",
      fontWeight: 700,
      color: "rgb(49,46,129)",
      textAlign: "left",
      textTransform: "none",
    };

    // Box metadati piano
    const metaBox: React.CSSProperties = {
      margin: "0 0 12px 0",
      padding: "8px",
      background: "rgb(238,242,255)",
      border: "1px solid rgb(219,234,254)",
      borderRadius: "6px",
      boxSizing: "border-box",
    };
    // Riga singola di metadati
    const row: React.CSSProperties = {
      margin: "0 0 4px 0",
      padding: "0",
      whiteSpace: "normal",
      wordWrap: "break-word",
      wordBreak: "break-word",
      overflowWrap: "anywhere",
    };

    // Sezione per ogni giorno
    const section: React.CSSProperties = {
      margin: "12px 0 0 0",
      padding: "12px",
      border: "1px solid rgb(229,231,235)",
      borderRadius: "6px",
      background: "rgb(255,255,255)",
    };
    // Titolo della sezione (giorno)
    const sectionTitle: React.CSSProperties = {
      margin: "0 0 8px 0",
      padding: "0",
      fontSize: "16px",
      fontWeight: 700,
      color: "rgb(31,41,55)",
    };

    // Riepilogo totali del giorno
    const totals: React.CSSProperties = {
      margin: "0 0 8px 0",
      padding: "6px",
      background: "rgb(249,250,251)",
      border: "1px solid rgb(229,231,235)",
      borderRadius: "4px",
    };
    // Voce singola dei totali
    const totalItem: React.CSSProperties = {
      display: "inline-block",
      margin: "0 12px 0 0",
      padding: "0",
      color: "rgb(55,65,81)",
    };

    // Card del singolo pasto
    const meal: React.CSSProperties = {
      margin: "8px 0 0 0",
      padding: "8px",
      border: "1px solid rgb(229,231,235)",
      borderRadius: "4px",
      background: "rgb(255,255,255)",
    };
    // Nome pasto
    const mealName: React.CSSProperties = {
      margin: "0 0 6px 0",
      padding: "0",
      fontWeight: 600,
      color: "rgb(49,46,129)",
    };
    // Lista alimenti
    const ulFoods: React.CSSProperties = {
      margin: "0",
      padding: "0 0 0 18px",
      listStyleType: "disc",
      listStylePosition: "outside",
    };

    // Render struttura stampabile/esportabile
    return (
      <div style={baseBody}>
        <div ref={rootRef} id="export-safe-root" style={page}>
          <h1 style={title}>Anteprima piano (compatibile)</h1>

          <div style={metaBox}>
            <div style={row}><strong>Scadenza:</strong> {meta.expire || "-"}</div>
            <div style={row}><strong>Obiettivo:</strong> {meta.goal}</div>
            <div style={row}><strong>Attività:</strong> {meta.activity}</div>
            <div style={row}>
              <strong>BMR:</strong> {meta.bmr ?? "—"} kcal • <strong>TDEE:</strong> {meta.tdee ?? "—"} kcal •{" "}
              <strong>Target:</strong> {meta.target ?? "—"} kcal/die
            </div>
            <div style={row}><strong>Sgarri:</strong> {meta.cheats || "nessuno"}</div>
          </div>

          {days.map((d, i) => (
            <div key={i} style={section}>
              <div style={sectionTitle}>{d.label}</div>
              <div style={totals}>
                <span style={totalItem}><strong>Kcal:</strong> {d.totals.kcal}</span>
                <span style={totalItem}><strong>Prot:</strong> {d.totals.protein} g</span>
                <span style={totalItem}><strong>Carb:</strong> {d.totals.carbs} g</span>
                <span style={totalItem}><strong>Fibre:</strong> {d.totals.fiber} g</span>
                <span style={totalItem}><strong>Grassi:</strong> {d.totals.fat} g</span>
              </div>

              {d.meals.map((m, j) => (
                <div key={j} style={meal}>
                  <div style={mealName}>{m.name}</div>
                  <ul style={ulFoods}>
                    {m.items.map((it, k) => <li key={k}>{it.text}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default ExportNutritionPreview;
