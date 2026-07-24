import { useCallback, useEffect, useState } from "react";
import { checkpointRepository as repository } from "@data/repositories";
import { Income, IncomeInput } from "@domain/entities/Income";

export function useIncome(userId: string | null) {
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const next = await repository.getIncome(userId);
      setIncome(next);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addIncome = useCallback(
    async (input: IncomeInput) => {
      if (!userId) return;
      const next = await repository.addIncome(userId, input);
      await refresh();
      return next;
    },
    [userId, refresh]
  );

  const removeIncome = useCallback(
    async (id: string) => {
      if (!userId) return;
      await repository.removeIncome(userId, id);
      await refresh();
    },
    [userId, refresh]
  );

  return { income, loading, error, refresh, addIncome, removeIncome };
}
