import { useCallback, useEffect, useState } from "react";
import { checkpointRepository as repository } from "@data/repositories";
import { SpendingDecision } from "@domain/entities/MoneyState";

export function useDecisions(userId: string | null, limit = 20) {
  const [decisions, setDecisions] = useState<SpendingDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const next = await repository.getRecentDecisions(userId, limit);
      setDecisions(next);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleRegret = useCallback(
    async (decision: SpendingDecision) => {
      if (!userId) return;
      await repository.setDecisionRegretted(userId, decision.id, !decision.regretted);
      await refresh();
    },
    [userId, refresh]
  );

  return { decisions, loading, error, refresh, toggleRegret };
}
