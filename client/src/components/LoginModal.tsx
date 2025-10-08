import { useState } from "react";

type Props = {
  onClose: () => void;
  onLoggedIn: (p: { token: string; userId: number; username: string }) => void;
};

export default function LoginModal({ onClose, onLoggedIn }: Props) {
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
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      if (!res.ok) throw new Error("Login fallito");
      const data = await res.json();
      onLoggedIn(data);
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
        <h3 className="font-bold text-lg mb-4">Accedi</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Inserisci username"
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
