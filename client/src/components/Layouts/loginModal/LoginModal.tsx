// client/src/components/Layouts/loginModal/LoginModal.tsx
import { useEffect, useId, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useLoginModal } from "../../../hooks/useLoginModal";

// Se usi proxy Vite: AUTH_BASE = "http://localhost:4000" o import.meta.env.VITE_AUTH_BASE
const AUTH_BASE = import.meta.env.VITE_AUTH_BASE ?? "http://localhost:4000";

/* ---------------------------------- Icons ---------------------------------- */
// Occhio aperto/chiuso minimal (niente librerie extra)
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18M10.6 10.6a3 3 0 104.2 4.2M9.88 4.24A9.77 9.77 0 0112 4c6.5 0 10 8 10 8a18.38 18.38 0 01-3.23 4.36M6.1 6.1C3.36 7.89 2 12 2 12a18.47 18.47 0 005.41 6.08"></path>
    </svg>
  );
}

/* ----------------------------- Password Field ------------------------------ */
function PasswordField({
  value,
  onChange,
  placeholder = "Password",
  name,
  autoComplete = "current-password",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  name?: string;
  autoComplete?: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  const [wink, setWink] = useState(false);
  const id = useId();
  const toggle = () => {
    setShow((s) => !s);
    setWink(true);
    setTimeout(() => setWink(false), 180);
  };
  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full border border-indigo-200 rounded-lg pl-3 pr-11 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 placeholder:text-gray-400 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition dark:hover:bg-gray-800"
        aria-label={show ? "Nascondi password" : "Mostra password"}
      >
        <span className={`transition-transform duration-200 ${show ? "rotate-6 scale-95" : ""} ${wink ? "scale-y-75" : ""}`}>
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </span>
      </button>
    </div>
  );
}

/* --------------------------------- Modal ---------------------------------- */
export default function LoginModal() {
  const { login } = useAuth();
  const { closeLoginModal } = useLoginModal();

  const [isRegister, setIsRegister] = useState(false);

  // comuni
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // registrazione
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<"M" | "F" | "O" | "">("");
  const [userType, setUserType] = useState<"utente" | "professionista">("utente");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [vat, setVat] = useState("");

  // avatar (solo registrazione, opzionale)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // messaggi / stato
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Iniziali per fallback avatar
  const initials = (() => {
    const A = (firstName || "").trim();
    const B = (lastName || "").trim();
    if (A && B) return (A[0] + B[0]).toUpperCase();
    if (A) return A.slice(0, 2).toUpperCase();
    if (B) return B.slice(0, 2).toUpperCase();
    return (username || "U").slice(0, 2).toUpperCase();
  })();

  function resetMessages() {
    setError(null);
    setSuccessMsg(null);
  }

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setAvatarFile(f);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(f ? URL.createObjectURL(f) : null);
  }

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      if (!isRegister) {
        // ---- LOGIN ----
        await login(username, password);
        closeLoginModal();
        return;
      }

      // ---- REGISTRAZIONE ----
      if (password !== confirmPassword) {
        throw new Error("Le password non coincidono.");
      }

      // payload base (usato solo se non c'è file)
      const payload: any = {
        username,
        password,
        firstName,
        lastName,
        dob: dob || null,
        sex: sex || null,
        type: userType, // 'utente' | 'professionista'
        email,
      };

      if (userType === "utente") {
        payload.weight = weight === "" ? null : Number(weight);
        payload.height = height === "" ? null : Number(height);
      } else {
        payload.vat = vat || null;
      }

      // 1) registra utente — UNA SOLA CHIAMATA
      if (avatarFile) {
        // invio TUTTO come multipart (il backend /api/auth/register accetta "avatar")
        const fd = new FormData();
        fd.append("username", username);
        fd.append("password", password);
        fd.append("email", email);
        if (firstName) fd.append("firstName", firstName);
        if (lastName)  fd.append("lastName", lastName);
        if (dob)       fd.append("dob", dob);
        if (sex)       fd.append("sex", sex);
        fd.append("type", userType); // "utente" | "professionista"

        if (userType === "utente") {
          if (weight !== "") fd.append("weight", String(weight)); // numeri come stringhe
          if (height !== "") fd.append("height", String(height));
        } else {
          if (vat) fd.append("vat", vat);
        }

        fd.append("avatar", avatarFile); // campo atteso dal backend

        const res = await fetch(`${AUTH_BASE}/api/auth/register`, {
          method: "POST",
          credentials: "include",
          body: fd, // NON settare Content-Type manualmente
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `Errore registrazione (HTTP ${res.status})`);
        }
      } else {
        // nessun file: invio JSON
        const res = await fetch(`${AUTH_BASE}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `Errore registrazione (HTTP ${res.status})`);
        }
      }

      setSuccessMsg("Registrazione completata! Eseguo l'accesso…");

      // 2) login automatico
      await login(username, password);
      closeLoginModal();
    } catch (err: any) {
      setError(err?.message || "Operazione non riuscita");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-2xl shadow-xl border border-indigo-100 p-7 w-full ${
          isRegister ? "max-w-xl" : "max-w-sm"
        } dark:bg-gray-900 dark:border-gray-800`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
              {isRegister ? "Crea il tuo account" : "Accedi"}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5 dark:text-gray-300">
              {isRegister ? "Un minuto e sei dentro." : "Bentornato!"}
            </p>
          </div>
          <button
            onClick={() => {
              setIsRegister(false);
              closeLoginModal();
            }}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Chiudi
          </button>
        </div>

        {/* Messaggi */}
        {successMsg && (
          <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* LOGIN */}
          {!isRegister && (
            <>
              <label className="block">
                <span className="text-sm text-gray-700 dark:text-gray-200">Username o Email</span>
                <input
                  className="mt-1 w-full border border-indigo-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                  placeholder="mario.rossi"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-700 dark:text-gray-200">Password</span>
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="mt-1"
                />
              </label>
            </>
          )}

          {/* REGISTRAZIONE */}
          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-gray-700 dark:text-gray-200">Nome</span>
                  <input
                    className="mt-1 w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    placeholder="Mario"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-700 dark:text-gray-200">Cognome</span>
                  <input
                    className="mt-1 w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    placeholder="Rossi"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-sm text-gray-700 dark:text-gray-200">Data di nascita</span>
                  <input
                    type="date"
                    className="mt-1 w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-700 dark:text-gray-200">Sesso</span>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="mt-1 w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                  >
                    <option value="" disabled hidden>
                      Seleziona
                    </option>
                    <option value="M">Maschile</option>
                    <option value="F">Femminile</option>
                    <option value="O">Altro</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm text-gray-700 dark:text-gray-200">Tipo utente</span>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as any)}
                    className="mt-1 w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                  >
                    <option value="utente">Utente</option>
                    <option value="professionista">Professionista</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-gray-700 dark:text-gray-200">Email</span>
                  <input
                    type="email"
                    className="mt-1 w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    placeholder="mario@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-700 dark:text-gray-200">Username</span>
                  <input
                    className="mt-1 w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    placeholder="mario.rossi"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </label>
              </div>

              {/* Avatar opzionale */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 dark:bg-gray-800/40 dark:border-gray-700">
                <span className="block text-sm text-gray-700 dark:text-gray-200 mb-2">Foto profilo (opzionale)</span>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full overflow-hidden ring-1 ring-indigo-100 bg-white flex items-center justify-center dark:bg-gray-900 dark:ring-gray-700"
                    aria-label="Anteprima avatar"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Anteprima avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-medium text-gray-500 select-none leading-none dark:text-gray-300">{initials}</span>
                    )}
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <span className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">
                      Carica foto
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={onPickAvatar}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-300">PNG, JPG, WEBP • max 5MB</span>
                  </label>
                </div>
              </div>

              {userType === "utente" && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-200">Peso (kg)</span>
                    <input
                      type="number"
                      className="mt-1 w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                      placeholder="70"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700 dark:text-gray-200">Altezza (cm)</span>
                    <input
                      type="number"
                      className="mt-1 w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                      placeholder="175"
                      value={height}
                      onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </label>
                </div>
              )}

              {userType === "professionista" && (
                <label className="block">
                  <span className="text-sm text-gray-700 dark:text-gray-200">Partita IVA</span>
                  <input
                    className="mt-1 w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    placeholder="IT12345678901"
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-gray-700 dark:text-gray-200">Password</span>
                  <PasswordField
                    value={password}
                    onChange={setPassword}
                    placeholder="Crea una password"
                    autoComplete="new-password"
                    className="mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-700 dark:text-gray-200">Conferma password</span>
                  <PasswordField
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Ripeti la password"
                    autoComplete="new-password"
                    className="mt-1"
                  />
                </label>
              </div>
            </>
          )}

          {/* Footer form */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setIsRegister((s) => !s);
              }}
              className="text-sm text-indigo-700 hover:underline dark:text-indigo-300"
            >
              {isRegister ? "Hai già un account? Accedi" : "Non hai un account? Registrati!"}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                onClick={closeLoginModal}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
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
