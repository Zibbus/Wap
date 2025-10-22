import type { Professional } from "../types/professional";

export async function listProfessionals(): Promise<Professional[]> {
  return [
    {
      id: 1,
      name: "Giulia R.",
      role: "personal_trainer",     // ✅
      online: true,
      rating: 4.9,
      reviewsCount: 87,
      pricePerHour: 45,
      city: "Milano",
      specialties: ["ipertrofia", "dimagrimento"],
      languages: ["IT", "EN"],
      verified: true,
      avatarUrl: "/images/giulia.jpg",
      yearsExp: 6,
      bio: "PT specializzata in ricomposizione corporea.",
      certificates: ["CONI PT Lv2", "ISSA CPT"],
    },
    {
      id: 2,
      name: "Luca B.",
      role: "nutrizionista",        // ✅
      online: false,
      rating: 4.7,
      reviewsCount: 52,
      pricePerHour: 60,
      city: "Roma",
      specialties: ["performance", "intolleranze"],
      languages: ["IT"],
      verified: true,
      avatarUrl: "/images/luca.jpg",
      yearsExp: 8,
      bio: "Nutrizionista sportivo con focus su performance.",
      certificates: ["Albo Biologi", "Sport Nutrition Cert."],
    },
  ];
}

export async function getProfessional(id: number): Promise<Professional | null> {
  const all = await listProfessionals();
  return all.find((p) => p.id === id) || null;
}
