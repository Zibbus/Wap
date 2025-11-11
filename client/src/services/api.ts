// client/src/services/api.ts

/* ========================= Helpers path ========================= */
function stripTrailingSlash(s: string) {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}
function ensureLeadingSlash(s: string) {
  return s.startsWith("/") ? s : `/${s}`;
}
function joinBase(base: string, path: string) {
  const b = stripTrailingSlash(base);
  const p = ensureLeadingSlash(path);
  return `${b}${p}`;
}

/* ========================= Base URLs ========================= */
// Default: usa proxy Vite o reverse proxy: "/api"
const RAW_API_BASE = (import.meta.env.VITE_API_BASE ?? "/api").toString().trim();
export const API_BASE = stripTrailingSlash(RAW_API_BASE);

// Se VITE_AUTH_BASE non è settata, deriva sempre da `${API_BASE}/auth`
const RAW_AUTH_BASE = (
  import.meta.env.VITE_AUTH_BASE ?? joinBase(API_BASE, "/auth")
).toString().trim();
export const AUTH_BASE = stripTrailingSlash(RAW_AUTH_BASE);

/* ========================= Auth token & creds ========================= */
const USE_CREDENTIALS = true; // true se usi cookie httpOnly
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

/* ========================= Querystring helper ========================= */
function toQuery(params?: Record<string, string | number | boolean | null | undefined>) {
  if (!params) return "";
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

/* ========================= Timeout helper ========================= */
function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Timeout di rete")), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      }
    );
  });
}

/* ========================= Client factory ========================= */
type JsonLike = Record<string, any> | any[];
type BodyInitLoose = BodyInit | JsonLike | null | undefined;
type RequestInitLoose = Omit<RequestInit, "body"> & { body?: BodyInitLoose };

function makeClient(base: string) {
  const http = async <T>(path: string, options: RequestInitLoose = {}): Promise<T> => {
    const url = joinBase(base, path);

    const headers = new Headers(options.headers ?? {});
    if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

    // Narrowing del body: BodyInitLoose -> BodyInit | null | undefined
    let bodyInit = options.body as BodyInit | null | undefined;

    const isFormData = typeof FormData !== "undefined" && bodyInit instanceof FormData;
    const isString   = typeof bodyInit === "string";
    const isBlob     = typeof Blob !== "undefined" && bodyInit instanceof Blob;
    const isURLSP    = typeof URLSearchParams !== "undefined" && bodyInit instanceof URLSearchParams;
    const isArrayBuf =
      (typeof ArrayBuffer !== "undefined" && bodyInit instanceof ArrayBuffer) ||
      (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(bodyInit as any));

    const shouldStringify =
      bodyInit != null &&
      !isFormData && !isString && !isBlob && !isURLSP && !isArrayBuf;

    if (shouldStringify && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (shouldStringify) {
      bodyInit = JSON.stringify(bodyInit) as unknown as BodyInit;
    }

    const res = await withTimeout(
      fetch(url, {
        credentials: USE_CREDENTIALS ? "include" : undefined,
        ...options,
        headers,
        body: bodyInit,
      })
    );

    if (!res.ok) {
      let msg = "";
      try {
        const text = await res.text();
        try {
          const j = JSON.parse(text);
          msg = (j && (j.error || j.message)) || text;
        } catch {
          msg = text;
        }
      } catch {
        /* ignore */
      }
      throw new Error(msg || `HTTP ${res.status} ${res.statusText}`);
    }

    // Gestione risposta
    const ct = res.headers.get("content-type") || "";
    if (!ct) return undefined as T;
    if (ct.includes("application/json")) return (await res.json()) as T;

    const txt = await res.text();
    return (txt ? (txt as unknown as T) : undefined as T);
  };

  return {
    get: <T>(path: string, params?: Record<string, any>) =>
      http<T>(path + toQuery(params)),

    // Body può essere BodyInit (FormData, Blob, string, URLSearchParams, ArrayBuffer…) o JSON-like
    post: <T>(path: string, body?: BodyInitLoose) =>
      http<T>(path, { method: "POST", body }),

    put: <T>(path: string, body?: BodyInitLoose) =>
      http<T>(path, { method: "PUT", body }),

    patch: <T>(path: string, body?: BodyInitLoose) =>
      http<T>(path, { method: "PATCH", body }),

    del: <T>(path: string) => http<T>(path, { method: "DELETE" }),
  };
}

/* ========================= Exports ========================= */
export const api = makeClient(API_BASE);
export const authApi = makeClient(AUTH_BASE);
