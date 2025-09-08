import { useEffect, useMemo, useState } from "react";

async function apiLogin(username: string) {
  const r = await fetch("http://localhost:4000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!r.ok) throw new Error("Login failed");
  return (await r.json()) as {
    token: string;
    userId: number;
    username: string;
  };
}

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [auth, setAuth] = useState<{
    token: string;
    userId: number;
    username: string;
  } | null>(null);

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

  const initials = useMemo(
    () => auth?.username?.slice(0, 2).toUpperCase() ?? "",
    [auth]
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white text-gray-800">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-indigo-100">
        <div className="max-w-6xl mx-auto h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-indigo-700">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              CC
            </div>
            Coach Connect
          </div>
          {!auth ? (
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            >
              Login
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                {initials}
              </div>
              <button
                onClick={() => setAuth(null)}
                className="px-3 py-1.5 rounded-lg border border-indigo-200 text-sm hover:bg-indigo-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-indigo-700">
          Benvenuto in Coach Connect
        </h1>
        <p className="mt-2 text-gray-600">
          Piattaforma leggera con chat realtime, backend Node+TS e database
          MySQL. Pensata per coach e studenti.
        </p>

        {/* Cards */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card icon="💬" title="Chat Realtime">
            Scambia messaggi in tempo reale tra utenti con WebSocket.
          </Card>
          <Card icon="🔐" title="Login Semplice">
            Accesso con username e JWT. Facile da estendere.
          </Card>
          <Card icon="🗄️" title="MySQL Nativo">
            Query pulite e migrazioni SQL lineari.
          </Card>
          <Card icon="📊" title="Vis per Data Viz">
            Integra grafici e reti con <b>vis</b> direttamente in pagina.
          </Card>
          <Card icon="⚙️" title="API chiare">
            REST per login/conversazioni, WS per eventi realtime.
          </Card>
          <Card icon="🚀" title="Pronto al Deploy">
            Configurazione .env e build TS standard.
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-indigo-100 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Coach Connect · Made with React +
        TypeScript
      </footer>

      {/* Modal di Login */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLoggedIn={(p) => setAuth(p)}
        />
      )}
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-xl">
          {icon}
        </div>
        <h3 className="font-bold text-lg text-indigo-700">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm">{children}</p>
    </article>
  );
}

function LoginModal({
  onClose,
  onLoggedIn,
}: {
  onClose: () => void;
  onLoggedIn: (p: { token: string; userId: number; username: string }) => void;
}) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError("Inserisci un username valido");
      return;
    }
    try {
      setLoading(true);
      const res = await apiLogin(username.trim());
      onLoggedIn(res);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Errore di login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-lg mb-2">Accedi</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="es. mattia"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
              onClick={onClose}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Accesso..." : "Entra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

