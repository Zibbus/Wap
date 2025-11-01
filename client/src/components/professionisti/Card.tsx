// client/src/components/professionisti/Card.tsx
import { Star, ShieldCheck, MapPin, Sparkles, MessageSquare } from "lucide-react";
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
  const extraCount = specialties.length > 3 ? specialties.length - 3 : 0;
  const isNew = p.reviewsCount === 0;
  const languages = Array.isArray(p.languages) ? p.languages : [];

  return (
    <article
      className="rounded-2xl border border-indigo-50 bg-white p-4 shadow hover:shadow-md transition dark:border-gray-800 dark:bg-gray-900"
      role="article"
      aria-label={`Scheda di ${p.name}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar + badge Nuovo */}
        <div className="relative shrink-0">
          <img
            src={p.avatarUrl || "/images/avatar-fallback.png"}
            alt={`Avatar di ${p.name}`}
            className="h-16 w-16 rounded-full object-cover ring-1 ring-gray-100 dark:ring-gray-800"
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src.endsWith("avatar-fallback.png")) return;
              e.currentTarget.src = "/images/avatar-fallback.png";
            }}
          />
          {isNew && (
            <span
              className="absolute -bottom-1 -right-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800"
              title="Nuovo professionista"
            >
              <Sparkles className="h-3 w-3" />
              Nuovo
            </span>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">{p.name}</h3>
            {p.verified && (
              <span title="Verificato" className="inline-flex">
                <ShieldCheck className="h-4 w-4 text-emerald-500" aria-label="Verificato" />
              </span>
            )}
          </div>

          <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
            {ROLE_LABEL[p.role]} •{" "}
            {p.online ? (
              "Online"
            ) : p.city ? (
              <>
                In presenza – {p.city}
              </>
            ) : (
              "In presenza"
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
              {p.rating.toFixed(1)} ({p.reviewsCount})
            </span>
            {p.city && (
              <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {p.city}
              </span>
            )}
          </div>

          {/* Specialità */}
          {(shownSpecs.length > 0 || extraCount > 0) && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {shownSpecs.map((s) => (
                <li
                  key={s}
                  className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  title={s}
                >
                  {s}
                </li>
              ))}
              {extraCount > 0 && (
                <li
                  className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] leading-5 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                  title={`Altre specialità: ${specialties.slice(3).join(", ")}`}
                >
                  +{extraCount}
                </li>
              )}
            </ul>
          )}

          {/* Lingue */}
          {languages.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {languages.map((lng) => (
                <li
                  key={lng}
                  className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  title={`Lingua: ${lng}`}
                >
                  {lng}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Prezzo + azioni */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{price} / h</div>
          <div className="flex gap-2">
            <button
              onClick={onOpen}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              aria-label={`Apri il profilo di ${p.name}`}
            >
              Vedi profilo
            </button>
            <button
              onClick={onContact}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
              aria-label={`Contatta ${p.name}`}
            >
              <MessageSquare className="h-4 w-4" />
              Contatta
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
