// client/src/hooks/useAuth.tsx
import { useEffect, useState, createContext, useContext } from "react";
import type { ReactNode } from "react";
import { apiLogin, apiLogout } from "../services/auth";
import { setAuthToken } from "../services/api";

export type AuthData = {
  token: string;
  userId: number;
  username: string;
  role?: "utente" | "professionista" | "admin";
  avatarUrl?: string | null;
};

type AuthContextType = {
  authData: AuthData | null;
  isLoading: boolean;
  updateAvatarUrl: (url: string) => void;
  /** Login con credenziali */
  login: (username: string, password?: string) => Promise<void>;
  /** Compat: setta direttamente i dati */
  loginWithData: (data: AuthData) => void;
  logout: () => Promise<void>;
  /** Esegue fn solo se loggato (puoi aprire qui il modal) */
  requireLogin: (fn: () => void) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_KEY = "authData";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bootstrap: rehydrate da localStorage + set Authorization
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed: AuthData = JSON.parse(saved);
        setAuthData(parsed);
        if (parsed?.token) setAuthToken(parsed.token);
        else setAuthToken(null);
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

  // Sync tra tab: se un’altra tab fa login/logout, aggiorna anche qui
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

  // Login con credenziali → salva token + set Authorization
  const login = async (username: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await apiLogin(username, password);
      // Adatta a ciò che ritorna la tua API
      const token = (res as any)?.token ?? "";
      const user = (res as any)?.user ?? {};

      if (!token) {
        throw new Error("Token non presente nella risposta di login");
      }

      const data: AuthData = {
        token,
        userId: user.id ?? user.userId ?? 0,
        username: user.username ?? username,
        role: (user.type as AuthData["role"]) ?? (user.role as AuthData["role"]),
        avatarUrl: user.avatarUrl ?? user.avatar_url ?? null,
      };

      setAuthToken(token); // 👉 fondamentale per evitare “Token mancante”
      setAuthData(data);
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } finally {
      setIsLoading(false);
    }
  };

  // Compat: set diretto dei dati (assicurati di passare token valido)
  const loginWithData = (data: AuthData) => {
    setAuthData(data);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    setAuthToken(data?.token || null);
  };

  const logout = async () => {
    try {
      await apiLogout().catch(() => {});
    } finally {
      setAuthToken(null);
      setAuthData(null);
      localStorage.removeItem(LS_KEY);
    }
  };

  const requireLogin = (fn: () => void) => {
    if (authData?.token) return fn();
    // Qui potresti aprire il tuo modal di login.
    const u = window.prompt("Per continuare, accedi. Username:");
    if (u) login(u).then(fn).catch(() => {});
  };

  const updateAvatarUrl = (url: string) => {
    setAuthData(prev => {
      if (!prev) return prev;
      const next: AuthData = { ...prev, avatarUrl: url || null };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        authData,
        isLoading,
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
