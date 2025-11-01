// client/src/pages/PlanChooser.tsx
import { useNavigate } from "react-router-dom";

export default function PlanChooser() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-indigo-50 dark:bg-gray-950 px-6 py-12">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Nutrizione */}
        <button
          type="button"
          onClick={() => navigate("/nutrizione")}
          className="group relative rounded-3xl overflow-hidden shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <img
            src="https://images.unsplash.com/photo-1601050690597-1a3c4d99d6b2?auto=format&fit=crop&w=1200&q=80"
            alt=""
            className="w-full h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/50 grid place-items-center text-center text-white px-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Crea piano nutrizionale</h2>
              <p className="opacity-90">Verrai portato alla pagina con il consenso da accettare.</p>
            </div>
          </div>
        </button>

        {/* Allenamento */}
        <button
          type="button"
          onClick={() => navigate("/workout")}
          className="group relative rounded-3xl overflow-hidden shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <img
            src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80"
            alt=""
            className="w-full h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/50 grid place-items-center text-center text-white px-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Crea scheda di allenamento</h2>
              <p className="opacity-90">Su /workout c’è già il gate di consenso prima del wizard.</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
