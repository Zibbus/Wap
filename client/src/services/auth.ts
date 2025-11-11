// client/src/services/auth.ts
import { AUTH_BASE } from "./api";

export type LoginResponse = { token: string; user: any };

/**
 * Login API (username/email + password)
 * - Evita redirect (redirect: "manual") per non causare reload silenziosi.
 * - Mappa 401/opaqueredirect in "Credenziali non valide".
 * - Ritorna { token, user } senza settare Authorization qui (lo fa useAuth).
 */
export async function apiLogin(
  usernameOrEmail: string,
  password?: string
): Promise<LoginResponse> {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ usernameOrEmail, password }),
    redirect: "manual",
  });

  // In CORS, un 302 può apparire come "opaqueredirect"
  if ((res as any).type === "opaqueredirect") {
    throw new Error("Credenziali non valide");
    // opzionale: potresti anche leggere res.url, ma in CORS non è disponibile
  }

  if (!res.ok) {
    let msg = "";
    try {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        msg = json?.error || json?.message || "";
      } catch {
        msg = text;
      }
    } catch {
      // ignore parse error
    }
    if (!msg && res.status === 401) msg = "Credenziali non valide";
    throw new Error(msg || `Errore login (HTTP ${res.status})`);
  }

  const data = (await res.json()) as LoginResponse;
  return data;
}

/**
 * Logout API (best-effort)
 * - Non rilancia errori: il caller può ignorare eventuali problemi.
 * - Non tocca Authorization: ci pensa useAuth.logout() a pulire.
 */
export async function apiLogout(): Promise<void> {
  try {
    await fetch(`${AUTH_BASE}/logout`, {
      method: "POST",
      credentials: "include",
      redirect: "manual",
    });
  } catch {
    // best-effort: ignora errori di rete
  }
}

export function bootstrapAuthFromStorage() {
}
