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
  return api.get<MeResponse>("/api/profile");
}

// Accetta campi opzionali; il backend aggiorna users e, se professionista, professional_profiles
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
  specialties?: string;         // CSV o JSON string per semplicità
  languages?: string;           // CSV o JSON string
  bio?: string;
}) {
  return api.put<{ ok: true }>("/api/profile", body);
}

// Upload avatar (solo professionisti): PATCH multipart
export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("file", file);
  // qui servono fetch “puro” perché FormData non va con il wrapper JSON
  const res = await fetch(`${import.meta.env.VITE_API_BASE ?? "http://localhost:4000"}/api/profile/avatar`, {
    method: "PATCH",
    body: form,
    credentials: "include",
    // Authorization arriva già da fetch? Se il tuo backend richiede il Bearer:
    headers: {
      Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ ok: true; avatarUrl: string }>;
}