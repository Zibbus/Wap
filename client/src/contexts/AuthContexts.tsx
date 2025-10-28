// client/src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { apiLogin, apiLogout, bootstrapAuthFromStorage } from "../services/auth";

type User = { id: number; username: string; type?: "utente"|"professionista" } | null;

type AuthCtx = {
  user: User;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  requireLogin: (fn: () => void) => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    // 1) recupera token dai storage e setta header
    bootstrapAuthFromStorage();

    // 2) prova a prendere il profilo corrente (se hai /api/auth/me)
    (async () => {
      try {
        // Se il tuo backend espone /api/auth/me:
        const me = await api.get<User>("/api/auth/me");
        setUser(me);
      } catch {
        // se non c'è /me, non è un problema
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (username: string, password?: string) => {
    setLoading(true);
    try {
      const res = await apiLogin(username, password);
      // se /api/auth/me esiste, aggiorna da server; altrimenti usa ciò che ritorna il login
      try {
        const me = await api.get<User>("/api/auth/me");
        setUser(me);
      } catch {
        setUser((res as any)?.user ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const requireLogin = (fn: () => void) => {
    if (user) return fn();
    // qui apri il tuo LoginModal (se ce l’hai) o reindirizza
    // esempio semplice:
    const u = prompt("Accedi — inserisci username:");
    if (u) login(u).then(fn);
  };

  const value = useMemo(() => ({ user, isLoading, login, logout, requireLogin }), [user, isLoading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}