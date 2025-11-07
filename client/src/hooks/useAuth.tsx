// client/src/hooks/useAuth.tsx
import { useEffect, useState, createContext, useContext, useCallback } from "react";
import type { ReactNode } from "react";
import { apiLogin, apiLogout } from "../services/auth";
import { setAuthToken } from "../services/api";

export type AuthData = {
  token: string;
  userId: number | string;
  username: string;
  role?: "utente" | "professionista" | "admin";
  avatarUrl?: string | null;
};

type AuthContextType = {
  authData: AuthData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  updateAvatarUrl: (url: string) => void;
  /** Login con credenziali */
  login: (usernameOrEmail: string, password?: string) => Promise<void>;
  /** Compat: setta direttamente i dati (deve includere token valido) */
  loginWithData: (data: AuthData) => void;
  logout: () => Promise<void>;
  /** Esegue fn solo se loggato (mini helper) */
  requireLogin: (fn: () => void) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_KEY = "authData";

/** Normalizza l'oggetto utente dalla risposta del backend */
function normalizeUser(raw: any, fallbackUsername: string) {
  return {
    id: raw?.id ?? raw?.userId ?? null,
    username: raw?.username ?? fallbackUsername,
    role: (raw?.type as AuthData["role"]) ?? (raw?.role as AuthData["role"]) ?? undefined,
    avatarUrl: raw?.avatarUrl ?? raw?.avatar_url ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Bootstrap: rehydrate da localStorage + set Authorization */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed: AuthData = JSON.parse(saved);
        setAuthData(parsed);
        setAuthToken(parsed?.token || null);
      } else {
        setAuthToken(null);
      }
    } catch {
      localStorage.removeItem(LS_KEY);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Sync tra tab: se un’altra tab fa login/logout, aggiorna anche qui */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_KEY) return;
      try {
        if (e.newValue) {
          const parsed: AuthData = JSON.parse(e.newValue);
          setAuthData(parsed);
          setAuthToken(parsed?.token || null);
        } else {
          setAuthData(null);
          setAuthToken(null);
        }
      } catch {
        setAuthData(null);
        setAuthToken(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** Login con credenziali → salva token + set Authorization */
  const login = useCallback(async (usernameOrEmail: string, password?: string) => {
    setIsLoading(true);
    try {
      // Deve restituire { token, user }
      const res = await apiLogin(usernameOrEmail, password);
      const token: string = (res as any)?.token ?? "";
      const rawUser = (res as any)?.user ?? {};

      if (!token) throw new Error("Token non presente nella risposta di login");

      const u = normalizeUser(rawUser, usernameOrEmail);
      const data: AuthData = {
        token,
        userId: u.id ?? 0,
        username: u.username,
        role: u.role,
        avatarUrl: u.avatarUrl,
      };

      setAuthToken(token);                     // 👉 Authorization: Bearer <token> per tutte le chiamate
      setAuthData(data);                       // stato in memoria
      localStorage.setItem(LS_KEY, JSON.stringify(data)); // persistenza
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Compat: set diretto dei dati (assicurati di passare token valido) */
  const loginWithData = useCallback((data: AuthData) => {
    setAuthData(data);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    setAuthToken(data?.token || null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout().catch(() => {}); // ignora eventuali errori del backend
    } finally {
      setAuthToken(null);
      setAuthData(null);
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  const requireLogin = useCallback((fn: () => void) => {
    if (authData?.token) return fn();
    // Se preferisci, qui puoi aprire il tuo LoginModal invece del prompt
    const u = window.prompt("Per continuare, accedi. Username:");
    if (u) login(u).then(fn).catch(() => {});
  }, [authData?.token, login]);

  const updateAvatarUrl = useCallback((url: string) => {
    setAuthData(prev => {
      if (!prev) return prev;
      const next: AuthData = { ...prev, avatarUrl: url || null };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isAuthenticated = !!authData?.token;

  return (
    <AuthContext.Provider
      value={{
        authData,
        isLoading,
        isAuthenticated,
        updateAvatarUrl,
        login,
        loginWithData,
        logout,
        requireLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve essere usato dentro un AuthProvider");
  return ctx;
}
