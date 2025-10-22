import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useLoginModal } from "../../../hooks/useLoginModal";

export default function LoginModal() {
  const { login } = useAuth();
  const { closeLoginModal } = useLoginModal();

  const [isRegister, setIsRegister] = useState(false);

  // Campi comuni
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Campi registrazione
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<"M" | "F" | "O" | "">("");
  const [userType, setUserType] = useState<"utente" | "professionista">("utente");
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [vat, setVat] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const validateEmail = (e: string) => /^\S+@\S+\.\S+$/.test(e);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();

    if (!username.trim() || !password) {
      setError("Inserisci username/email e password.");
      return;
    }

    if (isRegister) {
      if (!firstName.trim() || !lastName.trim()) {
        setError("Nome e cognome sono obbligatori.");
        return;
      }
      if (!dob) {
        setError("Inserisci la data di nascita.");
        return;
      }

      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

      if (userType === "utente" && age < 14) {
        setError("Devi avere almeno 14 anni per registrarti come utente.");
        return;
      }
      if (userType === "professionista" && age < 18) {
        setError("Devi avere almeno 18 anni per registrarti come professionista.");
        return;
      }
      if (!sex) {
        setError("Seleziona il sesso.");
        return;
      }
      if (!validateEmail(email)) {
        setError("Inserisci una email valida.");
        return;
      }
      if (password.length < 6) {
        setError("La password deve essere almeno 6 caratteri.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Le password non corrispondono.");
        return;
      }
      if (userType === "utente" && (weight === "" || height === "")) {
        setError("Peso e altezza sono obbligatori per un utente.");
        return;
      }
      if (userType === "professionista" && !vat.trim()) {
        setError("Inserisci la partita IVA per il professionista.");
        return;
      }
    }

    try {
      setLoading(true);

      if (isRegister) {
        const payload: any = {
          username: username.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dob,
          sex,
          type: userType,
          email: email.trim(),
        };

        if (userType === "utente") {
          payload.weight = Number(weight);
          payload.height = Number(height);
        } else {
          payload.vat = vat.trim();
        }

        const res = await fetch("http://localhost:4000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Errore durante la registrazione.");

        setSuccessMsg("Registrazione completata! Ora effettua il login.");
        setIsRegister(false);
        setPassword("");
        setConfirmPassword("");
      } else {
        const res = await fetch("http://localhost:4000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernameOrEmail: username.trim(), password }),
        });

        const raw = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(raw);
        } catch {}

        if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);

        const normalized = {
          token: data.token,
          userId: data.user?.id ?? data.userId,
          username: data.user?.username,
          role: data.user?.role ?? "utente",
          avatarUrl: data.user?.avatarUrl ?? undefined,
        };

        // ✅ Salva nel contesto globale
        localStorage.setItem("authData", JSON.stringify(normalized));
        login(normalized);
        closeLoginModal();
      }
    } catch (err: any) {
      setError(err?.message || "Errore di rete.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-xl shadow-xl p-7 w-full ${
          isRegister ? "max-w-lg" : "max-w-sm"
        }`}
      >
        {/* 🔹 Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">
            {isRegister ? "Registrazione" : "Accedi"}
          </h3>
          <button
            onClick={() => {
              setIsRegister(false);
              closeLoginModal();
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Chiudi
          </button>
        </div>

        {/* 🔹 Messaggi */}
        {successMsg && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-700 rounded">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* 🔹 Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 🔸 Login */}
          {!isRegister && (
            <>
              <input
                className="w-full border border-indigo-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="Username o Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                type="password"
                className="w-full border border-indigo-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          )}

          {/* 🔸 Registrazione */}
          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Nome"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  className="border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Cognome"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="date"
                  className="border border-indigo-200 rounded-lg px-3 py-2"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="border border-indigo-200 rounded-lg px-3 py-2 text-gray-700"
                >
                  <option value="" disabled hidden>
                    Sesso
                  </option>
                  <option value="M">Maschile</option>
                  <option value="F">Femminile</option>
                  <option value="O">Altro</option>
                </select>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as any)}
                  className="border border-indigo-200 rounded-lg px-3 py-2"
                >
                  <option value="utente">Utente</option>
                  <option value="professionista">Professionista</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  className="border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {userType === "utente" && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    className="border border-indigo-200 rounded-lg px-3 py-2"
                    placeholder="Peso (kg)"
                    value={weight}
                    onChange={(e) =>
                      setWeight(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                  <input
                    type="number"
                    className="border border-indigo-200 rounded-lg px-3 py-2"
                    placeholder="Altezza (cm)"
                    value={height}
                    onChange={(e) =>
                      setHeight(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>
              )}

              {userType === "professionista" && (
                <input
                  className="border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Partita IVA"
                  value={vat}
                  onChange={(e) => setVat(e.target.value)}
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="password"
                  className="border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <input
                  type="password"
                  className="border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Conferma Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {/* 🔹 Footer form */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setIsRegister((s) => !s);
              }}
              className="text-sm text-indigo-600 hover:underline"
            >
              {isRegister
                ? "Hai già un account? Accedi"
                : "Non hai un account? Registrati!"}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
                onClick={closeLoginModal}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading
                  ? "Attendi..."
                  : isRegister
                  ? "Registrati"
                  : "Entra"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}