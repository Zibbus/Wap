import type { Professional } from "../../types/professional";

export default function ProfileInfo({ p }: { p: Professional }) {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <section>
        <h3 className="font-bold text-lg">Bio</h3>
        <p className="text-gray-700 mt-2">{p.bio || "—"}</p>
      </section>
      <section>
        <h3 className="font-bold text-lg">Specializzazioni</h3>
        <ul className="text-gray-700 mt-2 list-disc list-inside">
          {p.specialties.map(s => <li key={s}>{s}</li>)}
        </ul>
      </section>
      <section>
        <h3 className="font-bold text-lg">Certificazioni</h3>
        <ul className="text-gray-700 mt-2 list-disc list-inside">
          {(p.certificates || []).map(c => <li key={c}>{c}</li>)}
        </ul>
      </section>
    </div>
  );
}
