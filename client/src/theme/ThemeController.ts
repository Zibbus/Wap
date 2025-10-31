// Piccolo controller di tema a livello app.
export type AppTheme = "light" | "dark" | "system";
const LS_KEY = "myfit-theme";

export function getStoredTheme(): AppTheme {
  const t = localStorage.getItem(LS_KEY);
  if (t === "light" || t === "dark" || t === "system") return t;
  return "light"; // default richiesto: CHIARO
}

export function applyTheme(theme: AppTheme) {
  const root = document.documentElement; // <html>
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;

  // Decidi se attivare dark CSS
  const isDark = theme === "dark" || (theme === "system" && prefersDark);

  root.classList.toggle("dark", isDark); // <-- punto chiave
  root.setAttribute("data-theme", isDark ? "dark" : "light"); // opzionale (per CSS custom)
}

export function setTheme(theme: AppTheme) {
  localStorage.setItem(LS_KEY, theme);
  applyTheme(theme);
}

// inizializza subito all’avvio app (importalo una volta in main)
export function initTheme() {
  applyTheme(getStoredTheme());

  // Se l’utente è su "system", reagisci ai cambi OS
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (mq) {
    mq.addEventListener?.("change", () => {
      if (getStoredTheme() === "system") applyTheme("system");
    });
  }
}
