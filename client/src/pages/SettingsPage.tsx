import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe, Ruler, Weight, Footprints, Flame, Clock, BadgeEuro,
  Bell, Shield, Eye, Accessibility, Languages, ToggleLeft, ToggleRight
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getSettings, saveSettings, type Settings } from "../services/settings";
import { usePageTitle } from "../hooks/usePageTitle";

const sectionTitle = "text-lg font-semibold text-gray-800 dark:text-gray-100";
const sectionCard  = "bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 border border-transparent dark:border-gray-800";

const DEFAULTS: Settings = {
  theme: "system",            // 👈 ignorato a livello UI (gestito da ThemeToggle)
  language: "it",
  timeFormat: "24h",
  currency: "EUR",
  units: {
    weight: "kg",
    height: "cm",
    distance: "km",
    energy: "kcal",
  },
  notifications: {
    email: true,
    push: false,
    chat: true,
  },
  privacy: {
    profileVisibility: "public", // public | clients | private
    showOnline: true,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    fontScale: 100,
  },
  professional: {
    isAvailableOnline: false,
    autoAcceptChat: false,
  },
};

export default function SettingsPage() {
  usePageTitle("Impostazioni");
  const { authData, isLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [form, setForm] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    if (isLoading) return;
    if (!authData) { navigate("/"); return; }

    (async () => {
      setLoading(true); setError(null);
      try {
        const s = await getSettings();
        setForm({
          ...DEFAULTS,
          ...s,
          // assicurati che esistano tutti i sotto-oggetti
          units:         { ...DEFAULTS.units,         ...(s.units || {}) },
          notifications: { ...DEFAULTS.notifications, ...(s.notifications || {}) },
          privacy:       { ...DEFAULTS.privacy,       ...(s.privacy || {}) },
          accessibility: { ...DEFAULTS.accessibility, ...(s.accessibility || {}) },
          professional:  { ...DEFAULTS.professional,  ...(s.professional || {}) },
        });
      } catch {
        setForm(DEFAULTS);
      } finally {
        setLoading(false);
      }
    })();
  }, [authData, isLoading, navigate]);

  const onSave = async () => {
    try {
      setSaving(true); setOkMsg(null); setError(null);
      // NON inviamo il tema (gestito dal toggle) — se il backend lo accetta, non fa danni
      const { theme, ...rest } = form;
      await saveSettings({ ...(rest as Settings), theme: form.theme });
      setOkMsg("Impostazioni salvate.");
    } catch (e: any) {
      setError(e?.message || "Errore salvataggio impostazioni");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 text-center">
          Caricamento…
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100">Impostazioni</h1>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Salvataggio…" : "Salva"}
        </button>
      </header>

      {error && <div className="bg-rose-50 text-rose-700 rounded-2xl p-4 shadow-sm dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}
      {okMsg && <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4 shadow-sm dark:bg-emerald-950/30 dark:text-emerald-200">{okMsg}</div>}

      {/* Aspetto — TOLTO il selettore TEMA (gestito da toggle) */}
      <section className={sectionCard}>
        <h2 className={sectionTitle}>Aspetto</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><Globe className="w-4 h-4" /> Lingua</span>
            <select
              value={form.language}
              onChange={(e) => setForm(f => ({ ...f, language: e.target.value }))}
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><Clock className="w-4 h-4" /> Formato orario</span>
            <select
              value={form.timeFormat}
              onChange={(e) => setForm(f => ({ ...f, timeFormat: e.target.value as Settings["timeFormat"] }))}
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            >
              <option value="24h">24 ore</option>
              <option value="12h">12 ore</option>
            </select>
          </label>
        </div>
      </section>

      {/* Unità & Valuta */}
      <section className={sectionCard}>
        <h2 className={sectionTitle}>Unità & Valuta</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><Weight className="w-4 h-4" /> Peso</span>
            <select
              value={form.units.weight}
              onChange={(e) => setForm(f => ({ ...f, units: { ...f.units, weight: e.target.value as any } }))}
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            >
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><Ruler className="w-4 h-4" /> Altezza</span>
            <select
              value={form.units.height}
              onChange={(e) => setForm(f => ({ ...f, units: { ...f.units, height: e.target.value as any } }))}
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            >
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><Footprints className="w-4 h-4" /> Distanza</span>
            <select
              value={form.units.distance}
              onChange={(e) => setForm(f => ({ ...f, units: { ...f.units, distance: e.target.value as any } }))}
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            >
              <option value="km">km</option>
              <option value="mi">mi</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><Flame className="w-4 h-4" /> Energia</span>
            <select
              value={form.units.energy}
              onChange={(e) => setForm(f => ({ ...f, units: { ...f.units, energy: e.target.value as any } }))}
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            >
              <option value="kcal">kcal</option>
              <option value="kJ">kJ</option>
            </select>
          </label>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><BadgeEuro className="w-4 h-4" /> Valuta</span>
            <select
              value={form.currency}
              onChange={(e) => setForm(f => ({ ...f, currency: e.target.value as any }))}
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </label>
        </div>
      </section>

      {/* Notifiche */}
      <section className={sectionCard}>
        <h2 className={sectionTitle}>Notifiche</h2>
        <div className="mt-2 grid md:grid-cols-3 gap-3">
          <Toggle
            icon={<Bell className="w-4 h-4" />}
            label="Email"
            checked={form.notifications.email}
            onChange={(v) => setForm(f => ({ ...f, notifications: { ...f.notifications, email: v } }))}
          />
          <Toggle
            icon={<Bell className="w-4 h-4" />}
            label="Push"
            checked={form.notifications.push}
            onChange={(v) => setForm(f => ({ ...f, notifications: { ...f.notifications, push: v } }))}
          />
          <Toggle
            icon={<Bell className="w-4 h-4" />}
            label="Chat"
            checked={form.notifications.chat}
            onChange={(v) => setForm(f => ({ ...f, notifications: { ...f.notifications, chat: v } }))}
          />
        </div>
      </section>

      {/* Privacy */}
      <section className={sectionCard}>
        <h2 className={sectionTitle}>Privacy</h2>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><Shield className="w-4 h-4" /> Visibilità profilo</span>
            <select
              value={form.privacy.profileVisibility}
              onChange={(e) => setForm(f => ({ ...f, privacy: { ...f.privacy, profileVisibility: e.target.value as any } }))}
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            >
              <option value="public">Pubblico</option>
              <option value="clients">Solo clienti</option>
              <option value="private">Privato</option>
            </select>
          </label>
          <Toggle
            icon={<Eye className="w-4 h-4" />}
            label="Mostra stato online"
            checked={form.privacy.showOnline}
            onChange={(v) => setForm(f => ({ ...f, privacy: { ...f.privacy, showOnline: v } }))}
          />
        </div>
      </section>

      {/* Accessibilità */}
      <section className={sectionCard}>
        <h2 className={sectionTitle}>Accessibilità</h2>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <Toggle
            icon={<Accessibility className="w-4 h-4" />}
            label="Riduci animazioni"
            checked={form.accessibility.reducedMotion}
            onChange={(v) => setForm(f => ({ ...f, accessibility: { ...f.accessibility, reducedMotion: v } }))}
          />
          <Toggle
            icon={<Accessibility className="w-4 h-4" />}
            label="Alto contrasto"
            checked={form.accessibility.highContrast}
            onChange={(v) => setForm(f => ({ ...f, accessibility: { ...f.accessibility, highContrast: v } }))}
          />
          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><Languages className="w-4 h-4" /> Dimensione testo</span>
            <input
              type="range"
              min={90} max={130} step={5}
              value={form.accessibility.fontScale}
              onChange={(e) => setForm(f => ({ ...f, accessibility: { ...f.accessibility, fontScale: Number(e.target.value) } }))}
              className="mt-3 w-full"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{form.accessibility.fontScale}%</div>
          </label>
        </div>
      </section>

      {/* Preferenze professionista */}
      <section className={sectionCard}>
        <h2 className={sectionTitle}>Preferenze professionista</h2>
        <div className="mt-2 grid md:grid-cols-2 gap-3">
          <Toggle
            icon={<ToggleLeft className="w-4 h-4" />}
            label="Disponibile per consulenze online"
            checked={form.professional.isAvailableOnline}
            onChange={(v) => setForm(f => ({ ...f, professional: { ...f.professional, isAvailableOnline: v } }))}
          />
          <Toggle
            icon={<ToggleRight className="w-4 h-4" />}
            label="Accetta chat automaticamente"
            checked={form.professional.autoAcceptChat}
            onChange={(v) => setForm(f => ({ ...f, professional: { ...f.professional, autoAcceptChat: v } }))}
          />
        </div>
      </section>
    </div>
  );
}

function Toggle({
  icon, label, checked, onChange,
}: { icon?: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-100">
        {icon} {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-1"}`}
        />
      </button>
    </label>
  );
}
