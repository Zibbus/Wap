import { forwardRef, useImperativeHandle, useRef } from "react";

export type ExportMealItem = { text: string };
export type ExportMeal = { name: string; items: ExportMealItem[] };
export type ExportDay = {
  label: string; // "Giorno 1 — Lunedì"
  totals: { kcal: number; protein: number; carbs: number; fiber: number; fat: number };
  meals: ExportMeal[];
};

export type ExportMeta = {
  expire: string;
  goal: string;
  activity: string;
  bmr?: number;
  tdee?: number;
  target?: number;
  cheats?: string;
};

export type ExportNutritionPreviewProps = {
  meta: ExportMeta;
  days: ExportDay[];
  offscreen?: boolean;
};

const ExportNutritionPreview = forwardRef<HTMLElement, ExportNutritionPreviewProps>(
  ({ meta, days, offscreen = false }, ref) => {
    const rootRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => rootRef.current as unknown as HTMLElement);

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

    const title: React.CSSProperties = {
      margin: "0 0 12px 0",
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
    const sectionTitle: React.CSSProperties = {
      margin: "0 0 8px 0",
      padding: "0",
      fontSize: "16px",
      fontWeight: 700,
      color: "rgb(31,41,55)",
    };

    const totals: React.CSSProperties = {
      margin: "0 0 8px 0",
      padding: "6px",
      background: "rgb(249,250,251)",
      border: "1px solid rgb(229,231,235)",
      borderRadius: "4px",
    };
    const totalItem: React.CSSProperties = {
      display: "inline-block",
      margin: "0 12px 0 0",
      padding: "0",
      color: "rgb(55,65,81)",
    };

    const meal: React.CSSProperties = {
      margin: "8px 0 0 0",
      padding: "8px",
      border: "1px solid rgb(229,231,235)",
      borderRadius: "4px",
      background: "rgb(255,255,255)",
    };
    const mealName: React.CSSProperties = {
      margin: "0 0 6px 0",
      padding: "0",
      fontWeight: 600,
      color: "rgb(49,46,129)",
    };
    const ulFoods: React.CSSProperties = {
      margin: "0",
      padding: "0 0 0 18px",
      listStyleType: "disc",
      listStylePosition: "outside",
    };

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
