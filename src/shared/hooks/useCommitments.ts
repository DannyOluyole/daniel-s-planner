import { useCallback, useEffect, useState } from "react";
import { checkpointRepository as repository } from "@data/repositories";
import { Commitment, CommitmentInput } from "@domain/entities/Commitment";

export function useCommitments(userId: string | null) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const next = await repository.getCommitments(userId);
      setCommitments(next);
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

  const addCommitment = useCallback(
    async (input: CommitmentInput) => {
      if (!userId) return;
      const next = await repository.addCommitment(userId, input);
      await refresh();
      return next;
    },
    [userId, refresh]
  );

  const removeCommitment = useCallback(
    async (id: string) => {
      if (!userId) return;
      await repository.removeCommitment(userId, id);
      await refresh();
    },
    [userId, refresh]
  );

  return { commitments, loading, error, refresh, addCommitment, removeCommitment };
}
