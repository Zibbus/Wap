// client/src/components/Header/drop-down_menu/ThemeToggle.tsx
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/* ==========================
   Utilities incluse qui
   ========================== */
type AppTheme = "light" | "dark";
const LS_KEY = "myfit-theme";

function getStoredTheme(): AppTheme {
  try {
    const t = localStorage.getItem(LS_KEY);
    return t === "dark" ? "dark" : "light"; // default: light
  } catch {
    return "light";
  }
}

function applyTheme(theme: AppTheme) {
  const root = document.documentElement; // <html>
  const isDark = theme === "dark";
  root.classList.toggle("dark", isDark);
  root.setAttribute("data-theme", isDark ? "dark" : "light"); // opzionale
}

function setStoredTheme(theme: AppTheme) {
  try {
    localStorage.setItem(LS_KEY, theme);
  } catch {}
  applyTheme(theme);
}

/* ==========================
   Componente Toggle Tema
   ========================== */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<AppTheme>("light");

  // All'avvio: leggi da LS e applica
  useEffect(() => {
    const initial = getStoredTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  // Sincronizza tra tab del browser
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY) {
        const v = (e.newValue === "dark" ? "dark" : "light") as AppTheme;
        setTheme(v);
        applyTheme(v);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = () => {
    const next: AppTheme = theme === "dark" ? "light" : "dark";
    setTheme(next);        // aggiorna UI
    setStoredTheme(next);  // persisti + applica a <html>
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Tema</span>

      <button
        type="button"
        onClick={toggle}
        aria-pressed={theme === "dark"}
        className={`relative inline-flex h-9 w-16 items-center rounded-full transition-colors
          ${theme === "dark" ? "bg-gray-800 ring-1 ring-gray-700" : "bg-indigo-600 ring-1 ring-indigo-600"}
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
        title={theme === "dark" ? "Passa a chiaro" : "Passa a scuro"}
      >
        {/* bagliore leggero sul binario */}
        <span
          className={`absolute inset-0 rounded-full opacity-20 ${theme === "dark" ? "bg-white" : "bg-black"}`}
          aria-hidden
        />
        {/* thumb */}
        <span
          className={`z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white
            transform transition-transform duration-300 shadow
            ${theme === "dark" ? "translate-x-8" : "translate-x-1"}`}
        >
          {theme === "dark" ? (
            <Moon className="w-4 h-4 text-gray-900" />
          ) : (
            <Sun className="w-4 h-4 text-indigo-600" />
          )}
        </span>
      </button>
    </div>
  );
}
