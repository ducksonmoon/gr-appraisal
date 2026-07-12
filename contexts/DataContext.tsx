'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Evaluation } from '@/types';
import { sampleData } from '@/data/sampleData';
import { parseExcelRowsToEvaluations } from '@/lib/excelParser';

type DataContextValue = {
  evaluations: Evaluation[];
  setEvaluations: (next: Evaluation[] | ((prev: Evaluation[]) => Evaluation[])) => void;
  addFromExcelRows: (rows: (string | number)[][], faculty: string) => Promise<number>;
  addEvaluation: (e: Omit<Evaluation, 'id'>) => Promise<Evaluation>;
  updateEvaluation: (id: string, patch: Partial<Evaluation>) => Promise<Evaluation>;
  deleteEvaluation: (id: string) => Promise<void>;
  resetToSample: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [evaluations, setEvaluationsState] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/evaluations', { credentials: 'include' });
      if (res.status === 401 && typeof window !== 'undefined') {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEvaluationsState(data.evaluations ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در بارگذاری داده‌ها');
      setEvaluationsState(sampleData.evaluations);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const setEvaluations = useCallback(
    (next: Evaluation[] | ((prev: Evaluation[]) => Evaluation[])) => {
      setEvaluationsState((prev) => {
        const nextList = typeof next === 'function' ? next(prev) : next;
        return nextList;
      });
    },
    []
  );

  const addFromExcelRows = useCallback(
    async (rows: (string | number)[][], faculty: string): Promise<number> => {
      const parsed = parseExcelRowsToEvaluations(rows, faculty, 1);
      if (parsed.length === 0) return 0;
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluations: parsed }),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در ذخیره');
      }
      await refetch();
      return parsed.length;
    },
    [refetch]
  );

  const addEvaluation = useCallback(
    async (e: Omit<Evaluation, 'id'>): Promise<Evaluation> => {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluations: [e] }),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در افزودن');
      }
      await refetch();
      const list = await fetch('/api/evaluations', { credentials: 'include' }).then((r) => r.json());
      const added = list.evaluations?.find(
        (x: Evaluation) =>
          (e.nationalId && x.nationalId === e.nationalId) ||
          (x.facultyName === e.facultyName && x.faculty === e.faculty)
      );
      return added ?? { ...e, id: '' };
    },
    [refetch]
  );

  const updateEvaluation = useCallback(
    async (id: string, patch: Partial<Evaluation>): Promise<Evaluation> => {
      const res = await fetch(`/api/evaluations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در بروزرسانی');
      }
      const data = await res.json();
      await refetch();
      return data.evaluation;
    },
    [refetch]
  );

  const deleteEvaluation = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`/api/evaluations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در حذف');
      }
      await refetch();
    },
    [refetch]
  );

  const resetToSample = useCallback(async () => {
    const res = await fetch('/api/evaluations/reset', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'خطا در بازگردانی');
    }
    await refetch();
  }, [refetch]);

  const value = useMemo<DataContextValue>(
    () => ({
      evaluations,
      setEvaluations,
      addFromExcelRows,
      addEvaluation,
      updateEvaluation,
      deleteEvaluation,
      resetToSample,
      isLoading,
      error,
      refetch,
    }),
    [
      evaluations,
      setEvaluations,
      addFromExcelRows,
      addEvaluation,
      updateEvaluation,
      deleteEvaluation,
      resetToSample,
      isLoading,
      error,
      refetch,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
