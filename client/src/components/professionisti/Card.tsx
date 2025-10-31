// client/src/components/professionisti/Card.tsx
import { Star, ShieldCheck, MapPin, Sparkles } from "lucide-react";
import type { Professional } from "../../types/professional";
import { ROLE_LABEL } from "../../types/professional";
import { useMemo } from "react";

type Props = {
  p: Professional;
  onOpen: () => void;
  onContact: () => void;
};

const fmtEUR = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default function Card({ p, onOpen, onContact }: Props) {
  const price = useMemo(() => fmtEUR.format(p.pricePerHour), [p.pricePerHour]);

  const specialties = Array.isArray(p.specialties) ? p.specialties : [];
  const shownSpecs = specialties.slice(0, 3);
  const extraSpecs = specialties.slice(3);
  const extraCount = extraSpecs.length;
  const extraTitle =
    extraCount > 0 ? `Altre specialità: ${extraSpecs.join(", ")}` : undefined;

  const languages = Array.isArray(p.languages) ? p.languages : [];
  const isNew = p.reviewsCount === 0;

  return (
    <article className="bg-white rounded-2xl shadow p-5 border border-indigo-50 dark:bg-gray-900 dark:border-gray-800">
      <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-md hover:shadow-2xl transition w-96 min-h-[480px] flex flex-col justify-between cursor-pointer dark:bg-gray-900 dark:border-gray-800">
        <div className="relative">
          <img
            src={p.avatarUrl || "/images/avatar-fallback.png"}
            alt={`Avatar di ${p.name}`}
            className="w-20 h-20 rounded-full object-cover"
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src.endsWith("avatar-fallback.png")) return;
              e.currentTarget.src = "/images/avatar-fallback.png";
            }}
          />
          {isNew && (
            <span
              className="absolute -bottom-1 -right-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800"
              title="Nuovo professionista"
            >
              <Sparkles className="w-3 h-3" />
              Nuovo
            </span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{p.name}</h3>
            {p.verified && (
              <span title="Verificato" className="inline-flex">
                <ShieldCheck className="w-5 h-5 text-emerald-500" aria-label="Verificato" />
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300">
            {ROLE_LABEL[p.role]} • {p.online ? "Online" : p.city ? <>In presenza – {p.city}</> : "In presenza"}
          </div>

          <div className="flex items-center gap-2 mt-1 text-sm text-gray-700 dark:text-gray-200">
            <Star className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span>
              {p.rating.toFixed(1)} ({p.reviewsCount})
            </span>
            {p.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                {p.city}
              </span>
            )}
          </div>

          {(shownSpecs.length > 0 || extraCount > 0) && (
            <ul className="flex flex-wrap gap-2 mt-2">
              {shownSpecs.map((s) => (
                <li
                  key={s}
                  className="text-xs px-2 py-1 rounded-md border border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  title={s}
                >
                  {s}
                </li>
              ))}
              {extraCount > 0 && (
                <li
                  className="text-xs px-2 py-1 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300"
                  title={extraTitle}
                >
                  +{extraCount}
                </li>
              )}
            </ul>
          )}

          {languages.length > 0 && (
            <ul className="flex flex-wrap gap-2 mt-2">
              {languages.map((lng) => (
                <li
                  key={lng}
                  className="text-[11px] leading-5 px-2 py-0.5 rounded-md border border-gray-200 bg-white text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
                  title={`Lingua: ${lng}`}
                >
                  {lng}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-indigo-700 dark:text-indigo-300 font-bold">{price} / h</div>
        <div className="flex gap-2">
          <button
            onClick={onOpen}
            className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            aria-label={`Apri il profilo di ${p.name}`}
          >
            Vedi profilo
          </button>
          <button
            onClick={onContact}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            aria-label={`Contatta ${p.name}`}
          >
            Contatta
          </button>
        </div>
      </div>
    </article>
  );
}
