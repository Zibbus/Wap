import { useEffect, useState } from "react";

export type AuthData = {
  token: string;
  userId: number;
  username: string;
};

export function useAuth() {
  const [auth, setAuth] = useState<AuthData | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("authData");
    if (saved) {
      try { setAuth(JSON.parse(saved)); }
      catch { localStorage.removeItem("authData"); }
    }
  }, []);

  const login = (data: AuthData) => {
    localStorage.setItem("authData", JSON.stringify(data));
    setAuth(data);
  };

  const logout = () => {
    localStorage.removeItem("authData");
    setAuth(null);
  };

  return { auth, login, logout };
}
