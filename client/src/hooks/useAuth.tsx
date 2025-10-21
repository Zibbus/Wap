import { createContext, useContext, useEffect, useState, type PropsWithChildren} from "react";

export type AuthData = {
  token: string;
  userId: number;
  username: string;
} | null;

type AuthContextType = {
  authData: AuthData;
  login: (data: NonNullable<AuthData>) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [authData, setAuthData] = useState<AuthData>(null);

  useEffect(() => {
  try {
    const raw = localStorage.getItem("authData");
    if (raw) {
      const data = JSON.parse(raw);
      // Controlla che ci sia un token valido
      if (data?.token && typeof data.token === "string" && data.token.length > 10) {
        setAuthData(data);
      } else {
        localStorage.removeItem("authData");
      }
    }
  } catch {
    localStorage.removeItem("authData");
  }
}, []);

  const login = (data: NonNullable<AuthData>) => {
    setAuthData(data);
    localStorage.setItem("authData", JSON.stringify(data));
  };

  const logout = () => {
    setAuthData(null);
    localStorage.removeItem("authData");
  };

  return (
    <AuthContext.Provider value={{ authData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}