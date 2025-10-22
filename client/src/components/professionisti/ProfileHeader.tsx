import { Star, ShieldCheck } from "lucide-react";
import type { Professional } from "../../types/professional";
import { ROLE_LABEL } from "../../types/professional";

type Props = {
  p: Professional;
  onMessage: () => void;
  onCall: () => void;
  onVideo: () => void;
};

export default function ProfileHeader({ p, onMessage, onCall, onVideo }: Props) {
  return (
    <div className="flex gap-6">
      <img src={p.avatarUrl || "/images/avatar-fallback.png"} className="w-28 h-28 rounded-full object-cover" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold">{p.name}</h1>
          {p.verified && (
            <span title="Verificato" className="inline-flex">
              <ShieldCheck className="w-6 h-6 text-emerald-500" aria-label="Verificato" />
            </span>
          )}
        </div>

        <div className="text-gray-600">
          {ROLE_LABEL[p.role]} • {p.online ? "Online" : p.city}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <Star className="w-5 h-5 text-amber-500" aria-hidden="true" />
          <span className="font-medium">{p.rating.toFixed(1)}</span>
          <span className="text-gray-500">({p.reviewsCount} recensioni)</span>
        </div>

        <div className="mt-2 text-indigo-700 font-bold">{p.pricePerHour}€ / h</div>
      </div>

      <div className="flex flex-col gap-2">
        <button onClick={onMessage} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Messaggia</button>
        <button onClick={onCall} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Chiama</button>
        <button onClick={onVideo} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Videochat</button>
      </div>
    </div>
  );
}