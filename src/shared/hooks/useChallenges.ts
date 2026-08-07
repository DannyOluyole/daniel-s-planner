import { useCallback, useEffect, useState } from "react";
import { checkpointRepository as repository } from "@data/repositories";
import { Challenge, ChallengeInput } from "@domain/entities/Challenge";

export function useChallenges(userId: string | null) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const next = await repository.getChallenges(userId);
      setChallenges(next);
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

  const startChallenge = useCallback(
    async (input: ChallengeInput) => {
      if (!userId) return;
      const next = await repository.startChallenge(userId, input);
      await refresh();
      return next;
    },
    [userId, refresh]
  );

  const removeChallenge = useCallback(
    async (id: string) => {
      if (!userId) return;
      await repository.removeChallenge(userId, id);
      await refresh();
    },
    [userId, refresh]
  );

  const activeChallenges = challenges.filter((c) => !c.removedAt);

  return { challenges: activeChallenges, loading, error, refresh, startChallenge, removeChallenge };
}
