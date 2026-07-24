import { useCallback, useEffect, useState } from "react";
import { checkpointRepository as repository } from "@data/repositories";
import {
  DecisionOutcome,
  MoneyState,
  SpendingDecisionInput,
} from "@domain/entities/MoneyState";

export function useCheckpoint(userId: string | null) {
  const [state, setState] = useState<MoneyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const next = await repository.getMoneyState(userId);
      setState(next);
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

  const recordDecision = useCallback(
    async (
      input: SpendingDecisionInput,
      outcome: DecisionOutcome,
      pauseDurationMs: number,
      pauseReason?: string
    ) => {
      if (!userId) return;
      const decision = await repository.recordDecision(
        userId,
        input,
        outcome,
        pauseDurationMs,
        pauseReason
      );
      await refresh();
      return decision;
    },
    [userId, refresh]
  );

  return { state, loading, error, refresh, recordDecision };
}
