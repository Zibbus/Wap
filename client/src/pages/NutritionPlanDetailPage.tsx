// src/pages/NutritionPlanDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ===== Tipi ===== */
type Item = {
  id: number;
  position: number;
  label: string;
  qty: number | null;
  unit: string | null;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g?: number | null;
};

type Meal = {
  id: number;
  position: number;
  name: string;
  notes: string | null;
  items: Item[];
};

type Day = {
  id: number;
  day: number;
  meals: Meal[];
};

type PlanDetail = {
  id: number;
  goal: string;
  expire: string | null;

  creator?: string;

  freelancer_id?: number | string | null;
  customer_id?: number | string | null;

  creator_user_id?: number | string | null;
  creator_first_name?: string | null;
  creator_last_name?: string | null;

  days: Day[];
};

/* ===== Helpers ===== */
const eqId = (a: unknown, b: unknown) =>
  a !== null && a !== undefined && b !== null && b !== undefined && Number(a) === Number(b);

function isExpiredDate(isoDate?: string | null): boolean {
  if (!isoDate) return false;
  const endOfDay = new Date(`${isoDate}T23:59:59`);
  return endOfDay.getTime() < Date.now();
}

function dayTotals(d: Day) {
  let kcal = 0, p = 0, c = 0, f = 0, fi = 0;
  for (const m of d.meals) {
    for (const it of m.items || []) {
      kcal += Number(it.kcal ?? 0);
      p    += Number(it.protein_g ?? 0);
      c    += Number(it.carbs_g ?? 0);
      f    += Number(it.fat_g ?? 0);
      fi   += Number((it as any).fiber_g ?? 0);
    }
  }
  return {
    kcal: Math.round(kcal),
    protein: Number(p.toFixed(1)),
    carbs: Number(c.toFixed(1)),
    fat: Number(f.toFixed(1)),
    fiber: Number(fi.toFixed(1)),
  };
}

function readAuthSnapshot() {
  let raw: any = {};
  try { raw = JSON.parse(localStorage.getItem("authData") || "{}"); } catch {}
  const user = raw.user ?? {};
  return {
    token: raw?.token ?? null,
    user: {
      id: user?.id ?? raw?.userId ?? null,
      username: user?.username ?? raw?.username ?? null,
      firstName: user?.first_name ?? user?.firstName ?? null,
      lastName: user?.last_name ?? user?.lastName ?? null,
      type: user?.type ?? raw?.role ?? null, // 'utente' | 'professionista' | 'admin' | null
      customerId: user?.customer?.id ?? raw?.customer_id ?? raw?.customerId ?? null,
      freelancerId: user?.freelancer?.id ?? user?.freelancer_id ?? user?.professional?.id ?? raw?.freelancer_id ?? null,
    },
  };
}

export default function NutritionPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auth (normalizzata)
  const { token, user } = useMemo(readAuthSnapshot, []);
  const myUsername = user.username || null;
  const myFull = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const myRole = user.type as "utente" | "professionista" | "admin" | null;

  // IDs effettivi (fallback da /api/me se non presenti in localStorage)
  const [ids, setIds] = useState<{ customerId: number | null; freelancerId: number | null }>({
    customerId: user.customerId ?? null,
    freelancerId: user.freelancerId ?? null,
  });

  useEffect(() => {
    // Se non abbiamo customerId/freelancerId, proviamo a recuperarli da /api/me
    if (!token) return;
    if (ids.customerId != null || ids.freelancerId != null) return;

    (async () => {
      try {
        const res = await fetch("http://localhost:4000/api/me", {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) return; // fallback: lascio decidere al backend lato azione
        const me = await res.json();
        setIds({
          customerId: me?.customer?.id ?? null,
          freelancerId: me?.freelancer?.id ?? null,
        });
      } catch {
        // ignora, fallback su permessi lato backend
      }
    })();
  }, [token, ids.customerId, ids.freelancerId]);

  // Fetch dettaglio
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/nutrition/plans/${id}`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as PlanDetail;
        setPlan(data);
      } catch (e: any) {
        setError(e?.message || "Errore caricamento piano nutrizionale");
      }
    })();
  }, [id, token]);

  // Etichetta creatore: preferisci Nome + Cognome
  const creatorLabel = useMemo(() => {
    if (!plan) return "—";
    const apiFull = [plan.creator_first_name, plan.creator_last_name].filter(Boolean).join(" ").trim();
    if (apiFull) return apiFull;

    // se non c'è freelancer: creato dal cliente
    if (!plan.freelancer_id) {
      return myFull || myUsername || plan.creator || "Cliente";
    }
    return plan.creator || "Professionista";
  }, [plan, myFull, myUsername]);

  // Permessi per mostrare il bottone
  const effectiveCustomerId = ids.customerId;
  const effectiveFreelancerId = ids.freelancerId;

  const canEdit = useMemo(() => {
    if (!plan) return false;
    if (myRole === "admin") return true;

    // Se abbiamo almeno uno dei due ID, valutiamo in modo "stretto"
    if (effectiveCustomerId != null || effectiveFreelancerId != null) {
      const isOwnerCustomer = eqId(plan.customer_id, effectiveCustomerId);
      const isOwnerPro = eqId(plan.freelancer_id, effectiveFreelancerId);
      return Boolean(isOwnerCustomer || isOwnerPro);
    }

    // Fallback: non siamo riusciti a ricavare gli ID dal client,
    // mostriamo comunque il bottone e lasciamo che i permessi siano
    // fatti valere dal backend (PUT/REPLACE già protetti).
    return true;
  }, [plan, myRole, effectiveCustomerId, effectiveFreelancerId]);

  // Payload leggero per la NutritionPage (evita “scoppio”)
  const editPayload = useMemo(() => {
    if (!plan) return null;
    return {
      id: plan.id,
      goal: plan.goal,
      expire: plan.expire,
      creator: plan.creator ?? null,
      freelancer_id: plan.freelancer_id ?? null,
      customer_id: plan.customer_id ?? null,
      creator_user_id: plan.creator_user_id ?? null,
      creator_first_name: plan.creator_first_name ?? null,
      creator_last_name: plan.creator_last_name ?? null,
      days: (plan.days || []).map((d) => ({
        id: d.id,
        day: d.day,
        meals: (d.meals || []).map((m) => ({
          id: m.id,
          position: m.position,
          name: m.name,
          notes: m.notes,
          items: (m.items || []).map((it) => ({
            id: it.id ?? 0,
            position: it.position,
            label: it.label,
            qty: it.qty,
            unit: it.unit,
            kcal: it.kcal,
            protein_g: it.protein_g,
            carbs_g: it.carbs_g,
            fat_g: it.fat_g,
            fiber_g: (it as any).fiber_g ?? null,
          })),
        })),
      })),
    };
  }, [plan]);

  // UI
  if (error) {
    return (
      <div className="min-h-screen bg-white px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="mb-6 text-indigo-600 hover:underline">
            ← Torna indietro
          </button>
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!plan) return <p className="text-center mt-20 text-gray-600">Caricamento…</p>;

  const expired = isExpiredDate(plan.expire);
  const expireLabel = plan.expire ? new Date(plan.expire).toLocaleDateString() : "—";

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-indigo-600 hover:underline">
            ← Torna indietro
          </button>

          {canEdit && (
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => {
                if (!editPayload) return;
                navigate("/nutrizione", { state: { editPlan: editPayload } });
              }}
              title="Modifica questo piano"
            >
              Modifica piano
            </button>
          )}
        </div>

        <h1 className="text-3xl font-bold text-indigo-700 mb-2">
          Piano nutrizionale #{plan.id} – {plan.goal?.replace("_", " ")}
        </h1>
        <p className="text-gray-600 mb-8">
          Scadenza:{" "}
          <span className={`font-semibold ${expired ? "!text-red-600" : "text-gray-800"}`}>
            {expireLabel}
          </span>
          {expired && (
            <span className="ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] bg-red-100 text-red-700">
              Scaduto
            </span>
          )}{" "}
          · Creatore: <strong>{creatorLabel}</strong>
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {plan.days.map((d) => {
            const t = dayTotals(d);
            return (
              <div key={d.id} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/40">
                <h3 className="font-bold text-indigo-700 mb-2">
                  Giorno {d.day}{" "}
                  <span className="text-[13px] text-indigo-600 font-medium">
                    | {t.kcal} kcal | P {t.protein} g | C {t.carbs} g | F {t.fat} g | Fib {t.fiber} g
                  </span>
                </h3>

                {d.meals.length ? d.meals.map((m) => (
                  <div key={m.id} className="mb-4 bg-white rounded p-3 border border-gray-100">
                    <div className="font-semibold">{m.name}</div>
                    {m.notes && <div className="text-xs text-gray-600 italic mt-0.5">💬 {m.notes}</div>}

                    <div className="mt-2 space-y-1">
                      {m.items.length ? m.items.map((it) => (
                        <div key={it.id} className="text-sm text-gray-800">
                          • {it.label} {it.qty != null ? `– ${it.qty}${it.unit || ""}` : ""}
                          {it.kcal != null && <> · {it.kcal} kcal</>}
                          {it.protein_g != null && <> · P {it.protein_g}g</>}
                          {it.carbs_g != null && <> · C {it.carbs_g}g</>}
                          {it.fat_g != null && <> · F {it.fat_g}g</>}
                          {(it as any).fiber_g != null && <> · Fib {(it as any).fiber_g}g</>}
                        </div>
                      )) : <div className="text-sm text-gray-500">Nessun alimento</div>}
                    </div>
                  </div>
                )) : <p className="text-sm text-gray-500">Nessun pasto</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
