// client/src/pages/ProfilePage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  User as UserIcon,
  Mail,
  Calendar,
  VenetianMask,
  Briefcase,
  MapPin,
  Banknote,
  Tag,
  Globe,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getMyProfile, updateMyProfile, uploadAvatar, type MeResponse } from "../services/profile";
import { usePageTitle } from "../hooks/usePageTitle";

// Stili condivisi (light/dark) per i campi "ghost"
const wrapBase = "mt-1 flex items-center px-0 py-2 border-b transition";
// const wrapRead = "border-transparent"; // RIMOSSO: non usato
const wrapEdit = "border-gray-200 focus-within:border-indigo-500 dark:border-gray-700 dark:focus-within:border-indigo-400";
const inputBase = "flex-1 bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100";
const labelTitle = "text-base font-semibold text-gray-800 dark:text-gray-100";
const iconMuted = "w-4 h-4 mr-2 text-gray-400 dark:text-gray-500";

const DEFAULT_AVATAR = "/images/avatar-fallback.png";

/* ---------- Utils ---------- */
function getInitials(a?: string | null, b?: string | null, fallback?: string) {
  const A = (a || "").trim();
  const B = (b || "").trim();
  if (A && B) return (A[0] + B[0]).toUpperCase();
  if (A) return A.slice(0, 2).toUpperCase();
  if (B) return B.slice(0, 2).toUpperCase();
  return (fallback || "U").slice(0, 2).toUpperCase();
}
function toDateOnly(v?: string | null): string {
  if (!v) return "";
  if (v.includes("T")) return v.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0,10);
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function splitCsv(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-indigo-800">
      {children}
    </span>
  );
}

/* ================================================================== */

export default function ProfilePage() {
  usePageTitle("Profilo");
  const { authData, isLoading, updateAvatarUrl } = useAuth();
  const navigate = useNavigate();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false); // view mode all'avvio

  // form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<"M" | "F" | "O" | "">("");

  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"personal_trainer" | "nutrizionista">("personal_trainer");
  const [city, setCity] = useState("");
  const [pricePerHour, setPricePerHour] = useState<number | "">("");
  const [specialties, setSpecialties] = useState("");
  const [languages, setLanguages] = useState("");
  const [bio, setBio] = useState("");

  // ✅ avatar: ora considera SEMPRE sia user.avatar_url sia professional.avatar_url (fallback ad authData.avatarUrl)
  const currentAvatar = useMemo(
    () =>
      ((me as any)?.user?.avatar_url as string | undefined) ||
      me?.professional?.avatar_url ||
      authData?.avatarUrl ||
      null,
    [me, authData]
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const isPro = me?.user.type === "professionista";
  const initials = getInitials(firstName, lastName, authData?.username);

  function fillFormFromMe(data: MeResponse) {
    setFirstName(data.user.first_name || "");
    setLastName(data.user.last_name || "");
    setEmail(data.user.email || "");
    setDob(toDateOnly(data.user.dob));
    setSex((data.user.sex as any) || "");

    if (data.user.type === "professionista" && data.professional) {
      setDisplayName(data.professional.display_name || "");
      setRole(data.professional.role);
      setCity(data.professional.city || "");
      setPricePerHour(data.professional.price_per_hour ?? "");
      setSpecialties((data.professional.specialties || []).join(", "));
      setLanguages((data.professional.languages || []).join(", "));
      setBio(data.professional.bio || "");
    } else {
      setDisplayName("");
      setRole("personal_trainer");
      setCity("");
      setPricePerHour("");
      setSpecialties("");
      setLanguages("");
      setBio("");
    }
  }

  useEffect(() => {
    if (isLoading) return;
    if (!authData) {
      navigate("/");
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyProfile();
        setMe(data);
        fillFormFromMe(data);
      } catch (e: any) {
        setError(e?.message || "Errore caricamento profilo");
      } finally {
        setLoading(false);
      }
    })();
  }, [authData, isLoading, navigate]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function onEnterEdit() {
    setOkMsg(null);
    setError(null);
    setEditMode(true);
  }
  function onCancelEdit() {
    if (me) fillFormFromMe(me);
    setEditMode(false);
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOkMsg(null);
    try {
      const payload: any = { firstName, lastName, email, dob, sex: sex || undefined };
      if (isPro) {
        payload.displayName = displayName;
        payload.role = role;
        payload.city = city;
        payload.pricePerHour = pricePerHour === "" ? undefined : Number(pricePerHour);
        payload.specialties = specialties;
        payload.languages = languages;
        payload.bio = bio;
      }
      await updateMyProfile(payload);
      setOkMsg("Profilo aggiornato correttamente.");
      setEditMode(false);
      const data = await getMyProfile();
      setMe(data);
      fillFormFromMe(data);
    } catch (e: any) {
      setError(e?.message || "Errore salvataggio");
    } finally {
      setSaving(false);
    }
  }

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setAvatarFile(f);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onUploadAvatar() {
    if (!avatarFile) return;
    setSaving(true);
    setError(null);
    setOkMsg(null);
    try {
      const res = await uploadAvatar(avatarFile);
      // ✅ aggiorna sia user.avatar_url che (se presente) professional.avatar_url
      setMe((old) =>
        old
          ? {
              ...old,
              user: { ...(old.user as any), avatar_url: res.avatarUrl } as any,
              professional: old.professional
                ? { ...old.professional, avatar_url: res.avatarUrl }
                : old.professional,
            }
          : old
      );
      // ✅ sincronizza anche l’header
      updateAvatarUrl(res.avatarUrl);

      setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setOkMsg("Immagine profilo aggiornata.");
    } catch (e: any) {
      setError(e?.message || "Errore caricamento immagine");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 text-center">Caricamento…</div>
      </div>
    );
  }
  if (!authData) {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-300">
        Devi effettuare l’accesso per vedere il profilo.
      </div>
    </div>
  );
}

if (!me) {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-8 text-rose-800 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
        Impossibile caricare il profilo in questo momento.
      </div>
    </div>
  );
}

  // avatar effettivo (preview > db > default)
  const avatarSrc = avatarPreview || currentAvatar || DEFAULT_AVATAR;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl from-indigo-600 via-indigo-500 to-indigo-400 dark:from-indigo-700 dark:via-indigo-600 dark:to-indigo-500 p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white/10 ring-1 ring-white/20 overflow-hidden grid place-items-center shrink-0">
            {avatarSrc && avatarSrc !== DEFAULT_AVATAR ? (
              <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-white/90 leading-none select-none">{initials}</span>
            )}
          </div>

          <div className="text-white">
            <h1 className="text-2xl md:text-3xl font-semibold">
              {displayName || `${firstName || ""} ${lastName || ""}`.trim() || authData.username}
            </h1>
            <p className="text-white/80">
              {isPro ? (role === "nutrizionista" ? "Nutrizionista" : "Personal Trainer") : "Utente"}
              {city ? ` • ${city}` : ""}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {!editMode ? (
              <button
                onClick={onEnterEdit}
                className="px-4 py-2 rounded-lg bg-white text-indigo-700 hover:bg-white/90 shadow-sm"
              >
                Modifica
              </button>
            ) : (
              <>
                <button onClick={onCancelEdit} className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
                  Annulla
                </button>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-white text-indigo-700 hover:bg-white/90 shadow-sm disabled:opacity-50"
                >
                  {saving ? "Salvataggio…" : "Salva"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ✅ Upload avatar in edit mode (NON solo pro) */}
        {editMode && (
          <div className="mt-4 flex items-center gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <span className="px-3 py-1.5 rounded-lg bg-white text-indigo-700 text-sm shadow-sm hover:bg-white/90">
                Scegli immagine
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={onPickAvatar}
              />
              <span className="text-xs text-white/80">PNG/JPG/WEBP • max 5MB</span>
            </label>
            <button
              onClick={onUploadAvatar}
              disabled={!avatarFile || saving}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 text-sm disabled:opacity-50"
            >
              Carica
            </button>
          </div>
        )}
      </div>

      {/* Messaggi */}
      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200 p-4 shadow-sm">
          {error}
        </div>
      )}
      {okMsg && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-200 p-4 shadow-sm">
          {okMsg}
        </div>
      )}

      {/* Dati personali – stile ghost */}
      <section className="mt-6 bg-white rounded-2xl shadow-sm p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Dati personali</h2>
          {!editMode ? (
            <span className="text-xs text-gray-500">Modo lettura</span>
          ) : (
            <span className="text-xs text-indigo-700">In modifica</span>
          )}
        </div>

        {!editMode ? (
          /* -------- VIEW MODE -------- */
          <div className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-2">
            <div>
              <span className={labelTitle}>Nome</span>
              <div className="mt-1 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <UserIcon className={iconMuted} />
                <span>{firstName || "—"}</span>
              </div>
            </div>

            <div>
              <span className={labelTitle}>Cognome</span>
              <div className="mt-1 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <UserIcon className={iconMuted} />
                <span>{lastName || "—"}</span>
              </div>
            </div>

            <div>
              <span className={labelTitle}>Email</span>
              <div className="mt-1 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <Mail className={iconMuted} />
                <span>{email || "—"}</span>
              </div>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Visibile solo a te.</p>
            </div>

            <div>
              <span className={labelTitle}>Data di nascita</span>
              <div className="mt-1 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <Calendar className={iconMuted} />
                <span>{toDateOnly(dob) || "—"}</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <span className={labelTitle}>Sesso</span>
              <div className="mt-1 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <VenetianMask className={iconMuted} />
                <span>
                  {sex === "M" ? "Maschile" : sex === "F" ? "Femminile" : sex === "O" ? "Altro" : "—"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* -------- EDIT MODE -------- */
          <div className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-2">
            <label className="block">
              <span className={labelTitle}>Nome</span>
              <div className={`${wrapBase} ${wrapEdit}`}>
                <UserIcon className={iconMuted} aria-hidden="true" />
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Mario"
                  className={inputBase}
                />
              </div>
            </label>

            <label className="block">
              <span className={labelTitle}>Cognome</span>
              <div className={`${wrapBase} ${wrapEdit}`}>
                <UserIcon className={iconMuted} aria-hidden="true" />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Rossi"
                  className={inputBase}
                />
              </div>
            </label>

            <label className="block">
              <span className={labelTitle}>Email</span>
              <div className={`${wrapBase} ${wrapEdit}`}>
                <Mail className={iconMuted} aria-hidden="true" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario@esempio.it"
                  className={inputBase}
                />
              </div>
            </label>

            <label className="block">
              <span className={labelTitle}>Data di nascita</span>
              <div className={`${wrapBase} ${wrapEdit}`}>
                <Calendar className={iconMuted} aria-hidden="true" />
                <input
                  type="date"
                  value={toDateOnly(dob)}
                  onChange={(e) => setDob(e.target.value)}
                  className={inputBase}
                />
              </div>
            </label>

            <label className="block md:col-span-2">
              <span className={labelTitle}>Sesso</span>
              <div className={`${wrapBase} ${wrapEdit}`}>
                <VenetianMask className={iconMuted} aria-hidden="true" />
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className={inputBase + " appearance-none pr-6"}
                >
                  <option value="">-</option>
                  <option value="M">Maschile</option>
                  <option value="F">Femminile</option>
                  <option value="O">Altro</option>
                </select>
              </div>
            </label>
          </div>
        )}
      </section>

      {/* Profilo professionista – stile ghost */}
      {me.user.type === "professionista" && (
        <section className="mt-6 bg-white rounded-2xl shadow-sm p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Profilo professionista</h2>
            {!editMode ? (
              <span className="text-xs text-gray-500">Modo lettura</span>
            ) : (
              <span className="text-xs text-indigo-700">In modifica</span>
            )}
          </div>

          {!editMode ? (
            /* -------- VIEW MODE -------- */
            <div className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-2">
              <div>
                <span className={labelTitle}>Nome pubblico</span>
                <div className="mt-1 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <UserIcon className={iconMuted} />
                  <span>{displayName || "—"}</span>
                </div>
              </div>

              <div>
                <span className={labelTitle}>Ruolo</span>
                <div className="mt-1 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <Briefcase className={iconMuted} />
                  <span>{role === "nutrizionista" ? "Nutrizionista" : "Personal Trainer"}</span>
                </div>
              </div>

              <div>
                <span className={labelTitle}>Città</span>
                <div className="mt-1 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <MapPin className={iconMuted} />
                  <span>{city || "—"}</span>
                </div>
              </div>

              <div>
                <span className={labelTitle}>Prezzo orario</span>
                <div className="mt-1 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <Banknote className={iconMuted} />
                  <span>
                    {pricePerHour === "" || pricePerHour == null
                      ? "—"
                      : new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
                          Number(pricePerHour)
                        )}
                  </span>
                </div>
              </div>

              <div className="md:col-span-1">
                <span className={labelTitle}>Specialità</span>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-gray-700 dark:text-gray-200">
                  <Tag className={iconMuted} />
                  {splitCsv(specialties).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {splitCsv(specialties).map((s) => (
                        <Chip key={s}>{s}</Chip>
                      ))}
                    </div>
                  ) : (
                    <span>Nessuna specialità impostata</span>
                  )}
                </div>
              </div>

              <div className="md:col-span-1">
                <span className={labelTitle}>Lingue</span>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-gray-700 dark:text-gray-200">
                  <Globe className={iconMuted} />
                  {splitCsv(languages).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {splitCsv(languages).map((lng) => (
                        <Chip key={lng}>{lng}</Chip>
                      ))}
                    </div>
                  ) : (
                    <span>Nessuna lingua impostata</span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <span className={labelTitle}>Bio</span>
                <div className="mt-1 flex items-start gap-2 text-gray-700 dark:text-gray-200">
                  <FileText className="w-4 h-4 mt-1 text-gray-400 dark:text-gray-500" />
                  <p className="whitespace-pre-wrap">{bio?.trim() ? bio : "—"}</p>
                </div>
              </div>
            </div>
          ) : (
            /* -------- EDIT MODE -------- */
            <div className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-2">
              <label className="block">
                <span className={labelTitle}>Nome pubblico</span>
                <div className={`${wrapBase} ${wrapEdit}`}>
                  <UserIcon className={iconMuted} aria-hidden="true" />
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Es. Dott. Mario Rossi"
                    className={inputBase}
                  />
                </div>
              </label>

              <label className="block">
                <span className={labelTitle}>Ruolo</span>
                <div className={`${wrapBase} ${wrapEdit}`}>
                  <Briefcase className={iconMuted} aria-hidden="true" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className={inputBase + " appearance-none pr-6"}
                  >
                    <option value="personal_trainer">Personal Trainer</option>
                    <option value="nutrizionista">Nutrizionista</option>
                  </select>
                </div>
              </label>

              <label className="block">
                <span className={labelTitle}>Città</span>
                <div className={`${wrapBase} ${wrapEdit}`}>
                  <MapPin className={iconMuted} aria-hidden="true" />
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Milano"
                    className={inputBase}
                  />
                </div>
              </label>

              <label className="block">
                <span className={labelTitle}>Prezzo orario (€)</span>
                <div className={`${wrapBase} ${wrapEdit}`}>
                  <Banknote className={iconMuted} aria-hidden="true" />
                  <input
                    type="number"
                    value={pricePerHour}
                    onChange={(e) => setPricePerHour(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="60"
                    className={inputBase}
                  />
                </div>
              </label>

              <label className="block">
                <span className={labelTitle}>Specialità (CSV)</span>
                <div className={`${wrapBase} ${wrapEdit}`}>
                  <Tag className={iconMuted} aria-hidden="true" />
                  <input
                    value={specialties}
                    onChange={(e) => setSpecialties(e.target.value)}
                    placeholder="ipertrofia, dimagrimento"
                    className={inputBase}
                  />
                </div>

                {/* Anteprima live chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {splitCsv(specialties).length > 0 ? (
                    splitCsv(specialties).map((s) => <Chip key={s}>{s}</Chip>)
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Nessuna specialità • separa con virgole</span>
                  )}
                </div>
              </label>

              <label className="block">
                <span className={labelTitle}>Lingue (CSV)</span>
                <div className={`${wrapBase} ${wrapEdit}`}>
                  <Globe className={iconMuted} aria-hidden="true" />
                  <input
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    placeholder="IT, EN"
                    className={inputBase}
                  />
                </div>

                {/* Anteprima live chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {splitCsv(languages).length > 0 ? (
                    splitCsv(languages).map((l) => <Chip key={l}>{l}</Chip>)
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Nessuna lingua • separa con virgole</span>
                  )}
                </div>
              </label>

              <label className="block md:col-span-2">
                <span className={labelTitle}>Bio</span>
                <div className={`${wrapBase} ${wrapEdit}`}>
                  <FileText className="w-4 h-4 mr-2 mt-1 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Parla della tua esperienza, metodologia e risultati."
                    className={inputBase + " min-h-[110px]"}
                  />
                </div>
              </label>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
