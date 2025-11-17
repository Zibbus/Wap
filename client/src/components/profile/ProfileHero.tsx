// client/src/components/profile/ProfileHero.tsx
import type { ReactNode } from "react";

type ProfileHeroProps = {
  avatarSrc: string | null;
  defaultAvatar: string;
  initials: string;
  title: string;
  subtitle: string;
  /** Bottoni Modifica / Annulla / Salva */
  actions?: ReactNode;
  /** Contenuto sotto la riga principale (es: upload avatar) */
  bottom?: ReactNode;
};

export function ProfileHero({
  avatarSrc,
  defaultAvatar,
  initials,
  title,
  subtitle,
  actions,
  bottom,
}: ProfileHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl from-...ndigo-700 dark:via-indigo-600 dark:to-indigo-500 p-6 shadow-sm">
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-white/10 rin...ring-white/20 overflow-hidden grid place-items-center shrink-0">
          {avatarSrc && avatarSrc !== defaultAvatar ? (
            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-white/90 leading-none select-none">
              {initials}
            </span>
          )}
        </div>

        <div className="text-white">
          <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
          <p className="text-white/80">{subtitle}</p>
        </div>

        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>

      {bottom && <div className="mt-4">{bottom}</div>}
    </div>
  );
}
