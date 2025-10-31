// services/settings.ts
import { api } from "./api";

export type Settings = {
  theme: "system" | "light" | "dark";
  language: "it" | "en" | string;
  timeFormat: "24h" | "12h";
  currency: "EUR" | "USD" | "GBP";
  units: {
    weight: "kg" | "lb";
    height: "cm" | "in";
    distance: "km" | "mi";
    energy: "kcal" | "kJ";
  };
  notifications: { email: boolean; push: boolean; chat: boolean };
  privacy: { profileVisibility: "public" | "clients" | "private"; showOnline: boolean };
  accessibility: { reducedMotion: boolean; highContrast: boolean; fontScale: number };
  professional: { isAvailableOnline: boolean; autoAcceptChat: boolean };
};

// ---- Costanti/Helper --------------------------------------------------------

const STORAGE_KEY = "app:settings";

// Default centralizzati (usati sia lato UI che per merge)
export const DEFAULTS: Settings = {
  theme: "system",
  language: "it",
  timeFormat: "24h",
  currency: "EUR",
  units: { weight: "kg", height: "cm", distance: "km", energy: "kcal" },
  notifications: { email: true, push: false, chat: true },
  privacy: { profileVisibility: "public", showOnline: true },
  accessibility: { reducedMotion: false, highContrast: false, fontScale: 100 },
  professional: { isAvailableOnline: false, autoAcceptChat: false },
};

/**
 * Unisce i settings remoti con i DEFAULTS mantenendo le strutture annidate.
 * Accetta Partial<Settings> dal server per tollerare campi mancanti.
 */
export function mergeWithDefaults(remote?: Partial<Settings> | null): Settings {
  const r = remote ?? {};
  return {
    ...DEFAULTS,
    ...r,
    units: { ...DEFAULTS.units, ...(r.units ?? {}) },
    notifications: { ...DEFAULTS.notifications, ...(r.notifications ?? {}) },
    privacy: { ...DEFAULTS.privacy, ...(r.privacy ?? {}) },
    accessibility: { ...DEFAULTS.accessibility, ...(r.accessibility ?? {}) },
    professional: { ...DEFAULTS.professional, ...(r.professional ?? {}) },
  };
}

// Cache locale semplice
export function loadCachedSettings(): Partial<Settings> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Settings>) : null;
  } catch {
    return null;
  }
}

export function saveSettingsCache(s: Partial<Settings> | Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignoriamo errori di quota
  }
}

export function clearSettingsCache() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// ---- API Pubbliche ----------------------------------------------------------

// GET /settings (passa dal proxy Vite: /api -> backend)
export async function getSettings(): Promise<Settings> {
  try {
    const remote = await withTimeout(api.get<Partial<Settings>>("/settings"));
    const merged = mergeWithDefaults(remote);
    saveSettingsCache(remote ?? {});
    return merged;
  } catch (e: any) {
    const cached = loadCachedSettings();
    if (cached) return mergeWithDefaults(cached);
    throw normalizeNetworkError(e, "Impossibile caricare le impostazioni");
  }
}

// PUT /settings
export async function saveSettings(payload: Settings): Promise<{ ok: true }> {
  try {
    const res = await withTimeout(api.put<{ ok: true }>("/settings", payload));
    saveSettingsCache(payload);
    return res;
  } catch (e: any) {
    throw normalizeNetworkError(e, "Errore salvataggio impostazioni");
  }
}

// ---- Utilities --------------------------------------------------------------

/**
 * Applica un timeout (default 10s) alla Promise ritornata da api.get/put.
 * Qui assumiamo che api.get/put usino fetch sotto al cofano.
 */
async function withTimeout<T>(p: Promise<T>, ms = 10_000): Promise<T> {
  // Non possiamo agganciare un AbortSignal se api.* non lo espone,
  // ma imponiamo un timeout logico.
  return await Promise.race<T>([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout durante la richiesta")), ms)
    ),
  ]);
}

/**
 * Converte errori fetch/CORS/HTTP in messaggi chiari.
 */
function normalizeNetworkError(e: any, prefix: string) {
  const msg = String(e?.message || e);

  // Timeout our
  if (msg.includes("Timeout durante la richiesta")) {
    return new Error(`${prefix}: Timeout.`);
  }
  // Tipico messaggio fetch quando dominio/porta non raggiungibile, CORS bloccato, mixed content ecc.
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return new Error(
      `${prefix}: impossibile contattare il server (URL errato, CORS o server non raggiungibile).`
    );
  }
  // Errori HTTP alzati da api.* (se li propaga come Error("HTTP 500 ..."))
  if (/HTTP\\s+\\d{3}/i.test(msg)) {
    return new Error(`${prefix}: ${msg}`);
  }
  return new Error(`${prefix}: ${msg}`);
}