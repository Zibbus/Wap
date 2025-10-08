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
    if (auth) localStorage.setItem("auth", JSON.stringify(auth));
    else localStorage.removeItem("auth");
  }, [auth]);

  const login = (data: AuthData) => setAuth(data);
  const logout = () => setAuth(null);

  return { auth, login, logout };
}
