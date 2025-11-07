// client/src/services/auth.ts
import { authApi, setAuthToken } from "./api";
type LoginResponse = { token?: string; user?: any };

export async function apiLogin(usernameOrEmail: string, password?: string) {
  const data = await authApi.post<LoginResponse>("/login", { usernameOrEmail, password });
  if (data?.token) setAuthToken(data.token); // imposta Authorization in memoria
  return data;
}

export async function apiLogout() {
  try {
    // opzionale: await authApi.post<void>("/logout");
  } finally {
    setAuthToken(null);
  }
  return { ok: true };
}

/**
 * Bootstrap opzionale:
 * Se vuoi recuperare un token legacy salvato altrove (es. "auth_token"),
 * puoi reimpostarlo all’avvio. Ma con il nuovo useAuth non serve.
 */
export function bootstrapAuthFromStorage() {
  // Se avevi usato una chiave legacy, la puoi leggere qui:
  const legacy = localStorage.getItem("auth_token");
  if (legacy) setAuthToken(legacy);
}
