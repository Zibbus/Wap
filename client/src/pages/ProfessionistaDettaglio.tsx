import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProfessional } from "../services/professionals";
import type { Professional } from "../types/professional";
import { ProfileHeader, ProfileInfo } from "../components/professionisti";
import { useAuth } from "../hooks/useAuth";
import { useLoginModal } from "../hooks/useLoginModal";

export default function ProfessionistaDettaglio() {
  const { id } = useParams();
  const [p, setP] = useState<Professional | null>(null);
  const { authData } = useAuth();
  const { openLoginModal } = useLoginModal();

  useEffect(() => {
    if (id) getProfessional(Number(id)).then(setP);
  }, [id]);

  if (!p) return <div className="max-w-5xl mx-auto px-6 py-12">Caricamento…</div>;

  const guard = (fn: () => void) => {
    if (!authData) return openLoginModal();
    fn();
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="bg-white rounded-2xl shadow p-6 border border-indigo-50">
        <ProfileHeader
          p={p}
          onMessage={() => guard(() => {/* TODO: navigate("/chat/...") */})}
          onCall={() => guard(() => {/* TODO: startCall() */})}
          onVideo={() => guard(() => {/* TODO: startVideo() */})}
        />
        <ProfileInfo p={p} />
      </div>
    </div>
  );
}
