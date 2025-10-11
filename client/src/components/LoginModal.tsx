import { useState } from "react";

type Props = {
  onClose: () => void;
  onLoggedIn: (p: { token: string; userId: number; username: string }) => void;
};

export default function LoginModal({ onClose, onLoggedIn }: Props) {
  const [isRegister, setIsRegister] = useState(false);

  // campi comuni
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // register specifici
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState(""); // YYYY-MM-DD
  const [sex, setSex] = useState<"M" | "F" | "O" | "">("");
  const [userType, setUserType] = useState<"utente" | "professionista">("utente");
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [vat, setVat] = useState(""); // partita iva per professionisti

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const validateEmail = (e: string) =>
    /^\S+@\S+\.\S+$/.test(e);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();

    if (!username.trim() || !password) {
      setError("Inserisci username e password.");
      return;
    }

    if (isRegister) {
      // validazioni specifiche registrazione
      if (!firstName.trim() || !lastName.trim()) {
        setError("Nome e cognome sono obbligatori.");
        return;
      }
      if (!dob) {
        setError("Inserisci la data di nascita.");
        return;
      }
      // Calcolo età
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      // Verifica età minima
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
      if (userType === "utente") {
        if (weight === "" || height === "") {
          setError("Peso e altezza sono obbligatori per un utente.");
          return;
        }
      } else if (userType === "professionista") {
        if (!vat.trim()) {
          setError("Inserisci la partita IVA per il professionista.");
          return;
        }
      }
    }

    try {
      setLoading(true);

      if (isRegister) {
        // payload registrazione (adatta al backend)
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
        if (!res.ok) throw new Error(data.error || "Errore registrazione");
        setSuccessMsg("Registrazione completata! Effettua il login.");
        // passa al tab login
        setIsRegister(false);
        setPassword("");
        setConfirmPassword("");
      } else {
        // LOGIN
        const res = await fetch("http://localhost:4000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Errore login");
        // onLoggedIn si aspetta { token, userId, username }
        onLoggedIn(data);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Errore di rete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div
          className={`bg-white rounded-xl shadow-xl p-7 w-full transition-all duration-300 ${
            isRegister ? "max-w-lg" : "max-w-sm"
          }`}
        >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">
            {isRegister ? "Registrazione" : "Accedi"}
          </h3>
          <button
            onClick={() => {
              setIsRegister(false);
              onClose();
            }}
            className="text-sm text-gray-500"
          >
            Chiudi
          </button>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Login fields */}
          {!isRegister && (
            <>
              <input
                className="w-full border border-indigo-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="Username"
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

          {/* Registration fields */}
          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Nome"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Cognome"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="date"
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2"
                >
                  <option value="utente">Utente</option>
                  <option value="professionista">Professionista</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* campi condizionali */}
              {userType === "utente" && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Peso */}
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full border border-indigo-200 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-500"
                      placeholder="Peso"
                      value={weight}
                      onChange={(e) =>
                        setWeight(e.target.value === "" ? "" : Number(e.target.value))
                      }
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      kg
                    </span>
                  </div>

                  {/* Altezza */}
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full border border-indigo-200 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-500"
                      placeholder="Altezza"
                      value={height}
                      onChange={(e) =>
                        setHeight(e.target.value === "" ? "" : Number(e.target.value))
                      }
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      cm
                    </span>
                  </div>
                </div>
              )}

              {userType === "professionista" && (
                <input
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Partita IVA"
                  value={vat}
                  onChange={(e) => setVat(e.target.value)}
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="password"
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2"
                  placeholder="Conferma Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setIsRegister((s) => !s);
              }}
              className="text-sm text-indigo-600 hover:underline"
            >
              {isRegister ? "Hai già un account? Accedi" : "Non hai un account? Registrati!"}
            </button>

            <div className="flex gap-2">
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
                {loading ? "Attendi..." : isRegister ? "Registrati" : "Entra"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
