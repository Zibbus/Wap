import { useEffect, useState, createContext, useContext } from "react";
import type { ReactNode } from "react";

export type AuthData = {
  token: string;
  userId: number;
  username: string;
  role?: "utente" | "professionista" | "admin";
  avatarUrl?: string; 
};

type AuthContextType = {
  authData: AuthData | null;
  isLoading: boolean;
  login: (data: AuthData) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Inizializza da localStorage solo all’avvio
  useEffect(() => {
    const saved = localStorage.getItem("authData");
    if (saved) {
      try {
        setAuthData(JSON.parse(saved));
      } catch {
        localStorage.removeItem("authData");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (data: AuthData) => {
    setAuthData(data);
    localStorage.setItem("authData", JSON.stringify(data));
  };

  const logout = () => {
    setAuthData(null);
    localStorage.removeItem("authData");
  };

  return (
    <AuthContext.Provider value={{ authData, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve essere usato dentro un AuthProvider");
  return context;
}