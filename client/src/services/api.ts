// client/src/services/api.ts
export const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";
export const AUTH_BASE = import.meta.env.VITE_AUTH_BASE ?? "http://localhost:4000";

// Se usi cookie/sessione cross-origin, metti true e NON ti serve il token.
const USE_CREDENTIALS = true;

// 👇 aggiungi queste due righe
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

function makeClient(base: string) {
  const http = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(`${base}${path}`, {
      headers: {
        "Content-Type": "application/json",
        // 👇 usa il token se presente
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options?.headers || {}),
      },
      credentials: USE_CREDENTIALS ? "include" : undefined,
      ...options,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  };

  return {
    get: <T>(path: string) => http<T>(path),
    post: <T>(path: string, body?: unknown) =>
      http<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
    put: <T>(path: string, body?: unknown) =>
      http<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
    del:  <T>(path: string) => http<T>(path, { method: "DELETE" }),
  };
}

export const api = makeClient(BASE);
export const authApi = makeClient(AUTH_BASE);
