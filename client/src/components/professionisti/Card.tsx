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
  const shownSpecs = specialties.slice(0, 2);
  const extraCount = Math.max(0, specialties.length - shownSpecs.length);
  const extraTitle =
    extraCount > 0 ? `Altre specialità: ${specialties.slice(2).join(", ")}` : undefined;

  const languages = Array.isArray(p.languages) ? p.languages : [];
  const isNew = p.reviewsCount === 0;

  return (
    <article
      className="group w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Top: avatar + info */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <img
            src={p.avatarUrl || "/images/avatar-fallback.png"}
            alt={`Avatar di ${p.name}`}
            className="h-14 w-14 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
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
              New
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
              {p.name}
            </h3>
            {p.verified && (
              <ShieldCheck className="h-4 w-4 text-emerald-500" aria-label="Verificato" />
            )}
          </div>

          <p className="mt-0.5 line-clamp-1 text-xs text-gray-600 dark:text-gray-300">
            {ROLE_LABEL[p.role]} •{" "}
            {p.online ? "Online" : p.city ? <>In presenza – {p.city}</> : "In presenza"}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden />
              {p.rating.toFixed(1)} ({p.reviewsCount})
            </span>
            {p.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {p.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle: tags */}
      {(shownSpecs.length > 0 || languages.length > 0) && (
        <div className="mt-3 space-y-2">
          {/* Specialità (max 2) + +N */}
          {(shownSpecs.length > 0 || extraCount > 0) && (
            <ul className="flex flex-wrap gap-1.5">
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
                  title={extraTitle}
                >
                  +{extraCount}
                </li>
              )}
            </ul>
          )}

          {/* Lingue */}
          {languages.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {languages.map((lng) => (
                <li
                  key={lng}
                  className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] leading-4 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  title={`Lingua: ${lng}`}
                >
                  {lng}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Bottom: prezzo + azioni */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          {price} <span className="font-normal text-gray-500 dark:text-gray-400">/ h</span>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={onOpen}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
            aria-label={`Apri il profilo di ${p.name}`}
          >
            Profilo
          </button>
          <button
            onClick={onContact}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            aria-label={`Contatta ${p.name}`}
          >
            Contatta
          </button>
        </div>
      </div>
    </article>
  );
}
