// client/src/services/profile.ts
import { api } from "./api";

export type MeResponse = {
  user: {
    id: number;
    username: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    dob: string | null;     // ISO (YYYY-MM-DD) o null
    sex: "M" | "F" | "O" | null;
    type: "utente" | "professionista";
  };
  professional: null | {
    id: number;
    freelancer_id: number;
    display_name: string | null;
    role: "personal_trainer" | "nutrizionista";
    city: string | null;
    price_per_hour: number | null;
    specialties: string[];  // già normalizzati
    languages: string[];    // già normalizzati
    bio: string | null;
    avatar_url: string | null;
    verified: 0 | 1;
    online: 0 | 1;
    rating: number;
    reviews_count: number;
  };
};

export async function getMyProfile(): Promise<MeResponse> {
  return api.get<MeResponse>("/profile");
}

// Aggiorna profilo utente + (se pro) profilo professionista
export async function updateMyProfile(body: {
  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: string;                 // YYYY-MM-DD
  sex?: "M" | "F" | "O";
  displayName?: string;
  role?: "personal_trainer" | "nutrizionista";
  city?: string;
  pricePerHour?: number;
  specialties?: string;         // CSV o JSON string
  languages?: string;           // CSV o JSON string
  bio?: string;
}) {
  return api.put<{ ok: true }>("/profile", body);
}

/**
 * Upload avatar (solo professionisti).
 * - Campo FormData: "avatar" (deve combaciare con multer.single("avatar"))
 * - Non impostare Content-Type manualmente
 * - Include Bearer token se presente in localStorage (AuthProvider salva "authData")
 */
export async function uploadAvatar(file: File): Promise<{ ok: true; avatarUrl: string }> {
  const form = new FormData();
  form.append("avatar", file); // <-- NOME CAMPO CORRETTO per multer.single("avatar")

  // Recupero token dal localStorage dove AuthProvider salva "authData"
  let token: string | undefined;
  try {
    const raw = localStorage.getItem("authData");
    if (raw) token = JSON.parse(raw)?.token;
  } catch {
    /* ignore */
  }

  const res = await fetch(`/profile/avatar`, {
    method: "PATCH",               // <-- usa PATCH come prima; se il route è POST, cambia in "POST"
    body: form,                    // <-- niente JSON.stringify
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Upload avatar fallito");
  }
  return res.json();
}
