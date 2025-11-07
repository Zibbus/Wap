// client/src/pages/ProfessionistaDettaglio.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProfessional } from "../services/professionals";
import type { Professional } from "../types/professional";

// 🔻 Import diretti, niente barrel
import ProfileHeader from "../components/professionisti/ProfileHeader";
import ProfileInfo from "../components/professionisti/ProfileInfo";

import { useAuth } from "../hooks/useAuth";
import { useLoginModal } from "../hooks/useLoginModal";

import { usePageTitle } from "../hooks/usePageTitle";

/* ---- Skeleton minimal per il loading ---- */
function Skeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ProfessionistaDettaglio() {
  usePageTitle("Professionisti");
  const { id } = useParams();
  const [p, setP] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const { authData } = useAuth();
  const { openLoginModal } = useLoginModal();

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        if (!id || Number.isNaN(Number(id))) {
          throw new Error("ID professionista non valido.");
        }
        const data = await getProfessional(Number(id));
        if (alive) setP(data);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Errore caricamento profilo");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const guard = (fn: () => void) => {
    if (!authData) return openLoginModal();
    fn();
  };

  if (loading) return <Skeleton />;

  if (err) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
          {err}
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
          Nessun professionista trovato.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <ProfileHeader
          p={p}
          onMessage={() => guard(() => {
            /* TODO: navigate("/chat/...") */
          })}
          onCall={() => guard(() => {
            /* TODO: startCall() */
          })}
          onVideo={() => guard(() => {
            /* TODO: startVideo() */
          })}
        />
        <div className="mt-6">
          <ProfileInfo p={p} />
        </div>
      </div>
    </div>
  );
}
