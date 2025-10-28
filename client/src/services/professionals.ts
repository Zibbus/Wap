// client/src/services/professionals.ts
import { api } from "./api";
import type { Professional } from "../types/professional";

const parseJson = (x: unknown, fallback: any[] = []) => {
  if (Array.isArray(x)) return x;
  if (x === null || x === undefined) return fallback;
  try { return JSON.parse(String(x)); } catch { return fallback; }
};

const mapRowFromApi = (r: any): Professional => ({
  id: Number(r.id),
  name: String(r.name ?? r.username ?? ""),
  role: r.role, // "personal_trainer" | "nutrizionista"
  online: !!r.online,
  rating: Number(r.rating ?? 0),
  reviewsCount: Number(r.reviews_count ?? r.reviewsCount ?? 0),
  pricePerHour: Number(r.price_per_hour ?? r.pricePerHour ?? 0),
  city: r.city ?? null,
  specialties: parseJson(r.specialties),
  languages: parseJson(r.languages),
  verified: !!r.verified,
  avatarUrl: r.avatar_url ?? r.avatarUrl ?? null,
  bio: r.bio ?? null,
});

export async function listProfessionals(params?: {
  q?: string;
  role?: "all" | "personal_trainer" | "nutrizionista";
  onlineOnly?: boolean;
  minRating?: number;
  maxPrice?: number | "";
}): Promise<Professional[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.role && params.role !== "all") qs.set("role", params.role);
  if (params?.onlineOnly) qs.set("onlineOnly", "1");
  if (params?.minRating !== undefined) qs.set("minRating", String(params.minRating));
  if (params?.maxPrice !== undefined && params.maxPrice !== "")
    qs.set("maxPrice", String(params.maxPrice));

  const url = `/api/professionals${qs.toString() ? `?${qs.toString()}` : ""}`;

  try {
    const data = await api.get<any[]>(url);
    return (data ?? []).map(mapRowFromApi);
  } catch (err: any) {
    // Se l'endpoint non esiste o torna 404, mostra empty state invece di crashare
    if (String(err?.message || "").includes("404")) return [];
    throw err;
  }
}

export async function getProfessional(id: number): Promise<Professional | null> {
  try {
    const data = await api.get<any>(`/api/professionals/${id}`);
    return mapRowFromApi(data);
  } catch (err: any) {
    if (String(err?.message || "").includes("404")) return null;
    throw err;
  }
}