// client/src/hooks/useWeightHistory.ts
import { useEffect, useState } from "react";
import { api } from "../services/api";

export type WeightPoint = {
  id: number;
  weight: number;
  measured_at: string;
};

type UseWeightHistoryReturn = {
  data: WeightPoint[];
  loading: boolean;
  error: string | null;
  addWeight: (weight: number) => Promise<void>;
  updateWeight: (id: number, weight: number) => Promise<void>;
  deleteWeight: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useWeightHistory(): UseWeightHistoryReturn {
  const [data, setData] = useState<WeightPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      // GET /api/weight-history
      const rows = await api.get<WeightPoint[]>("/weight-history");

      const sorted = [...rows].sort(
        (a, b) =>
          new Date(a.measured_at).getTime() -
          new Date(b.measured_at).getTime()
      );

      setData(sorted);
    } catch (e: any) {
      console.error("[GET /weight-history] error", e);
      setError(
        e?.response?.data?.message ??
          e?.message ??
          "Errore nel caricamento delle misurazioni"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, []);

  async function addWeight(weight: number) {
    try {
      setError(null);

      // POST /api/weight-history
      const created = await api.post<WeightPoint>("/weight-history", {
        weight,
      });

      setData((prev) =>
        [...prev, created].sort(
          (a, b) =>
            new Date(a.measured_at).getTime() -
            new Date(b.measured_at).getTime()
        )
      );
    } catch (err: any) {
      console.error("[POST /weight-history] error", err);
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Errore nel salvataggio del peso"
      );
      throw err;
    }
  }

  async function updateWeight(id: number, weight: number) {
    try {
      setError(null);

      // PUT /api/weight-history/:id
      const updated = await api.put<WeightPoint>(
        `/weight-history/${id}`,
        { weight }
      );

      setData((prev) =>
        prev
          .map((p) => (p.id === id ? updated : p))
          .sort(
            (a, b) =>
              new Date(a.measured_at).getTime() -
              new Date(b.measured_at).getTime()
          )
      );
    } catch (err: any) {
      console.error("[PUT /weight-history/:id] error", err);
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Errore nella modifica della misurazione"
      );
      throw err;
    }
  }

  async function deleteWeight(id: number) {
    try {
      setError(null);

      // NEL TUO CLIENT È api.del, NON api.delete
      // DELETE /api/weight-history/:id
      await api.del(`/weight-history/${id}`);

      setData((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error("[DELETE /weight-history/:id] error", err);
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Errore nell'eliminazione della misurazione"
      );
      throw err;
    }
  }

  return {
    data,
    loading,
    error,
    addWeight,
    updateWeight,
    deleteWeight,
    refresh: fetchData,
  };
}
