// client/src/services/auth.ts
import { authApi, setAuthToken } from "./api";

type LoginResponse = { token?: string; user?: any };

// LOGIN
export async function apiLogin(username: string, password?: string) {
  // Il backend si aspetta "usernameOrEmail"
  const data = await authApi.post<LoginResponse>("/api/auth/login", {
    usernameOrEmail: username,
    password,
  });

  // Se usi JWT: salva e imposta Authorization per le chiamate successive
  if (data?.token) {
    localStorage.setItem("auth_token", data.token);
    setAuthToken(data.token);
  }
  return data;
}

// LOGOUT (se hai endpoint server, chiamalo; altrimenti no-op)
export async function apiLogout() {
  try {
    // Se esiste l'endpoint:
    // await authApi.post("/api/auth/logout");
  } catch {
    // ignora errori in logout
  } finally {
    localStorage.removeItem("auth_token");
    setAuthToken(null);
  }
  return { ok: true };
}

// Bootstrap da storage all’avvio app
export function bootstrapAuthFromStorage() {
  const token = localStorage.getItem("auth_token");
  setAuthToken(token);
}