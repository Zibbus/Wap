import { Star, ShieldCheck, MapPin } from "lucide-react";
import type { Professional } from "../../types/professional";
import { ROLE_LABEL } from "../../types/professional";

type Props = {
  p: Professional;
  onOpen: () => void;
  onContact: () => void;
};

export default function Card({ p, onOpen, onContact }: Props) {
  return (
    <article className="bg-white rounded-2xl shadow p-5 border border-indigo-50">
      <div className="flex gap-4">
        <img src={p.avatarUrl || "/images/avatar-fallback.png"} className="w-20 h-20 rounded-full object-cover" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">{p.name}</h3>
            {p.verified && (
              <span title="Verificato" className="inline-flex">
                <ShieldCheck className="w-5 h-5 text-emerald-500" aria-label="Verificato" />
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600">
            {ROLE_LABEL[p.role]} • {p.online ? "Online" : p.city ? <>In presenza – {p.city}</> : "In presenza"}
          </div>

          <div className="flex items-center gap-2 mt-1 text-sm">
            <Star className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span>{p.rating.toFixed(1)} ({p.reviewsCount})</span>
            {p.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                {p.city}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600 mt-1">
            {p.specialties.slice(0, 3).join(" • ")}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-indigo-700 font-bold">{p.pricePerHour}€ / h</div>
        <div className="flex gap-2">
          <button onClick={onOpen} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            Vedi profilo
          </button>
          <button onClick={onContact} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            Contatta
          </button>
        </div>
      </div>
    </article>
  );
}
