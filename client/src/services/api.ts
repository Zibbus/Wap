// client/src/services/api.ts
const API_BASE  = import.meta.env.VITE_API_BASE  ?? "/api";
const AUTH_BASE = import.meta.env.VITE_AUTH_BASE ?? (import.meta.env.DEV ? "http://localhost:4000/api/auth" : "/api/auth");

const USE_CREDENTIALS = true; // ok se usi cookie altrove; col JWT non è obbligatorio

let authToken: string | null = null;
export function setAuthToken(token: string | null) { authToken = token; }

// helper per querystring
function toQuery(params?: Record<string, string | number | boolean | null | undefined>) {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    usp.set(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

function makeClient(base: string) {
  const http = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(`${base}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options?.headers || {}),
      },
      credentials: USE_CREDENTIALS ? "include" : undefined,
      ...options,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
    }
    const txt = await res.text();
    return (txt ? JSON.parse(txt) : undefined) as T;
  };

  return {
    // 👇 ora accetta opzionalmente i query params
    get:  <T>(path: string, params?: Record<string, any>) =>
      http<T>(path + toQuery(params)),

    post: <T>(path: string, body?: unknown) =>
      http<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),

    put:  <T>(path: string, body?: unknown) =>
      http<T>(path, { method: "PUT",  body: JSON.stringify(body ?? {}) }),

    // 👇 nuovo metodo patch
    patch:<T>(path: string, body?: unknown) =>
      http<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),

    del:  <T>(path: string) =>
      http<T>(path, { method: "DELETE" }),
  };
}

export const api     = makeClient(API_BASE);
export const authApi = makeClient(AUTH_BASE);
