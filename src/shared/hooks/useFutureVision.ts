import { useCallback, useEffect, useState } from "react";
import { checkpointRepository as repository } from "@data/repositories";

/**
 * The "Future Self" concept — a short, free-text answer to "what does
 * financial freedom look like to you," set once during onboarding and
 * editable later, referenced back in Decision Mode's narrative.
 */
export function useFutureVision(userId: string | null) {
  const [vision, setVisionState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const next = await repository.getFutureVision(userId);
      setVisionState(next);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setVision = useCallback(
    async (text: string) => {
      if (!userId) return;
      await repository.setFutureVision(userId, text);
      setVisionState(text);
    },
    [userId]
  );

  return { vision, loading, refresh, setVision };
}
