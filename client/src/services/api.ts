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

// timeout helper
function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Timeout di rete")), ms);
    p.then(
      v => { clearTimeout(id); resolve(v); },
      e => { clearTimeout(id); reject(e); }
    );
  });
}

function makeClient(base: string) {
  const http = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const url = `${base}${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options?.headers as Record<string, string> | undefined),
    };

    const res = await withTimeout(fetch(url, {
      credentials: USE_CREDENTIALS ? "include" : undefined,
      ...options,
      headers,
    }));

    if (!res.ok) {
      let msg = "";
      try {
        const text = await res.text();
        try {
          const j = JSON.parse(text);
          msg = j?.error || j?.message || text;
        } catch {
          msg = text;
        }
      } catch {}
      throw new Error(msg || `HTTP ${res.status} ${res.statusText}`);
    }

    // niente body (204) o content-type non JSON → ritorna undefined o testo
    const ct = res.headers.get("content-type") || "";
    if (!ct) return undefined as T;
    if (ct.includes("application/json")) return (await res.json()) as T;

    const txt = await res.text();
    return (txt ? (txt as unknown as T) : undefined as T);
  };

  return {
    get:  <T>(path: string, params?: Record<string, any>) =>
      http<T>(path + toQuery(params)),

    post: <T>(path: string, body?: unknown) =>
      http<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),

    put:  <T>(path: string, body?: unknown) =>
      http<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),

    patch:<T>(path: string, body?: unknown) =>
      http<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),

    del:  <T>(path: string) =>
      http<T>(path, { method: "DELETE" }),
  };
}

export const api     = makeClient(API_BASE);
export const authApi = makeClient(AUTH_BASE);
