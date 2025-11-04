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
  /** Login con credenziali: preferito */
  login: (username: string, password?: string) => Promise<void>;
  /** Compatibilità: setta direttamente i dati (vecchio comportamento) */
  loginWithData: (data: AuthData) => void;
  logout: () => Promise<void>;
  /** Esegue fn solo se loggato, altrimenti puoi agganciare qui l'apertura del modal */
  requireLogin: (fn: () => void) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ bootstrap da localStorage + imposta Authorization sul client HTTP
  useEffect(() => {
    const saved = localStorage.getItem("authData");
    if (saved) {
      try {
        const parsed: AuthData = JSON.parse(saved);
        setAuthData(parsed);
        if (parsed?.token) setAuthToken(parsed.token);
      } catch {
        localStorage.removeItem("authData");
      }
    }
    setIsLoading(false);
  }, []);

  // ✅ nuovo: login con credenziali → chiama API, salva token e dati
  const login = async (username: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await apiLogin(username, password);
      // adatta qui in base a cosa restituisce il tuo backend di login
      const token = (res as any)?.token || "";
      const user = (res as any)?.user || {};

      const data: AuthData = {
        token,
        userId: user.id ?? user.userId ?? 0,
        username: user.username ?? username,
        role: (user.type as AuthData["role"]) ?? (user.role as AuthData["role"]),
        avatarUrl: user.avatarUrl ?? user.avatar_url ?? null,
      };

      setAuthToken(token);
      setAuthData(data);
      localStorage.setItem("authData", JSON.stringify(data));
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ compat: se in qualche punto chiami ancora login(data: AuthData)
  const loginWithData = (data: AuthData) => {
    setAuthData(data);
    localStorage.setItem("authData", JSON.stringify(data));
    if (data?.token) setAuthToken(data.token);
  };

  const logout = async () => {
    try {
      await apiLogout(); // se non usi endpoint di logout, resta così
    } finally {
      setAuthToken(null);
      setAuthData(null);
      localStorage.removeItem("authData");
    }
  };

  const requireLogin = (fn: () => void) => {
    if (authData) return fn();
    // Qui puoi aprire il tuo LoginModal (se ce l’hai).
    // Placeholder semplice: prompt
    const u = window.prompt("Per continuare, accedi. Username:");
    if (u) login(u).then(fn);
  };

  // ✅ nuovo: aggiorna solo l'avatar (usato dopo upload in ProfilePage)
  const updateAvatarUrl = (url: string) => {
    setAuthData(prev => {
      if (!prev) return prev;
      const next: AuthData = { ...prev, avatarUrl: url || null };
      localStorage.setItem("authData", JSON.stringify(next));
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
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve essere usato dentro un AuthProvider");
  return context;
}
