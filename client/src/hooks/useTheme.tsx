// client/src/hooks/useTheme.ts
import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "ui:theme";

function applyTheme(t: "light" | "dark") {
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark"); // ⬅️ forziamo la rimozione
  (root as any).dataset.theme = t;
}

export function getInitialTheme(): Theme {
  // prova da localStorage; altrimenti usa preferenza OS
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  const osDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return osDark ? "dark" : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // sincronizza tra tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "light" || e.newValue === "dark")) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = (t: Theme) => setThemeState(t);

  return { theme, setTheme };
}
