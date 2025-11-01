// src/types/professional.ts
export type ProfessionalRole = "personal_trainer" | "nutrizionista";

export type Professional = {
  id: number;
  name: string;
  role: ProfessionalRole;
  avatarUrl?: string;
  city?: string;
  online: boolean;
  rating: number;
  reviewsCount: number;
  pricePerHour: number;
  specialties: string[];
  languages: string[];
  verified: boolean;
  bio?: string;
  certificates?: string[];
  yearsExp?: number;
  userId?: number;
  email?: string | null;
};

export const ROLE_LABEL: Record<ProfessionalRole, string> = {
  personal_trainer: "Personal Trainer",
  nutrizionista: "Nutrizionista",
};
