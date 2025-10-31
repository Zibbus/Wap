import { useEffect, useState } from "react";
import { setTheme, getStoredTheme, type AppTheme, applyTheme } from "../../../../theme/ThemeController";
import { Sun, Moon, MonitorSmartphone } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setLocal] = useState<AppTheme>(() => getStoredTheme());

  useEffect(() => {
    // assicurati che quando rientri in pagina, applichi quello salvato
    applyTheme(theme);
  }, [theme]);

  const setAll = (t: AppTheme) => {
    setLocal(t);
    setTheme(t); // salva e applica globalmente
  };

  const btn = "px-2 py-1 rounded-lg border text-sm flex items-center gap-2";
  const active = "bg-indigo-600 text-white border-indigo-600";
  const idle = "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700";

  return (
    <div className="flex items-center gap-1">
      <button
        className={`${btn} ${theme === "light" ? active : idle}`}
        onClick={() => setAll("light")}
        title="Tema chiaro"
      >
        <Sun className="w-4 h-4" /> Chiaro
      </button>
      <button
        className={`${btn} ${theme === "dark" ? active : idle}`}
        onClick={() => setAll("dark")}
        title="Tema scuro"
      >
        <Moon className="w-4 h-4" /> Scuro
      </button>
      <button
        className={`${btn} ${theme === "system" ? active : idle}`}
        onClick={() => setAll("system")}
        title="Segui sistema"
      >
        <MonitorSmartphone className="w-4 h-4" /> Sistema
      </button>
    </div>
  );
}
