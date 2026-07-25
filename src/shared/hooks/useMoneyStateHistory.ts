import { useCallback, useEffect, useState } from "react";
import { checkpointRepository as repository } from "@data/repositories";
import { MoneyState } from "@domain/entities/MoneyState";

/**
 * Historical money_states snapshots — the real data behind Future You's
 * 12-month projection (see domain/money/futureYouProjection.ts). Empty in
 * local/demo mode, since nothing persists a snapshot history there.
 */
export function useMoneyStateHistory(userId: string | null, sinceDaysAgo = 180) {
  const [history, setHistory] = useState<MoneyState[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const next = await repository.getMoneyStateHistory(userId, sinceDaysAgo);
      setHistory(next);
    } finally {
      setLoading(false);
    }
  }, [userId, sinceDaysAgo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { history, loading, refresh };
}
