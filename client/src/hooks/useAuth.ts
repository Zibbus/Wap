import { useEffect, useState } from "react";

export type AuthData = {
  token: string;
  userId: number;
  username: string;
};

export function useAuth() {
  const [auth, setAuth] = useState<AuthData | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem("auth");
    if (raw) {
      try {
        setAuth(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
  const savedAuth = localStorage.getItem("authData");
  if (savedAuth) {
    try {
      const parsed = JSON.parse(savedAuth);
      setAuth(parsed);
    } catch {
      localStorage.removeItem("authData");
    }
  }
}, []);
 
  const login = (data: AuthData) => setAuth(data);
  const logout = () =>
    {
      localStorage.removeItem("authData");
      setAuth(null);
  }

  return { auth, login, logout };
}
