import { useCallback, useEffect, useState } from "react";
import { checkpointRepository as repository } from "@data/repositories";
import { SavingsGoal, SavingsGoalInput } from "@domain/entities/SavingsGoal";

export function useSavingsGoals(userId: string | null) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const next = await repository.getSavingsGoals(userId);
      setGoals(next);
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

  const addGoal = useCallback(
    async (input: SavingsGoalInput) => {
      if (!userId) return;
      const next = await repository.addSavingsGoal(userId, input);
      await refresh();
      return next;
    },
    [userId, refresh]
  );

  const updateGoal = useCallback(
    async (id: string, input: SavingsGoalInput) => {
      if (!userId) return;
      const next = await repository.updateSavingsGoal(userId, id, input);
      await refresh();
      return next;
    },
    [userId, refresh]
  );

  const removeGoal = useCallback(
    async (id: string) => {
      if (!userId) return;
      await repository.removeSavingsGoal(userId, id);
      await refresh();
    },
    [userId, refresh]
  );

  const activeGoals = goals.filter((g) => !g.removedAt);

  return { goals: activeGoals, loading, error, refresh, addGoal, updateGoal, removeGoal };
}
