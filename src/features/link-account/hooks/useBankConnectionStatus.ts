import { useCallback, useEffect, useState } from "react";
import { BankConnectionStatus } from "@domain/repositories/BankLinkRepository";
import { bankLinkRepository as repository } from "@data/repositories";

export function useBankConnectionStatus(userId: string | null) {
  const [status, setStatus] = useState<BankConnectionStatus>("unlinked");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const next = await repository.getConnectionStatus(userId);
      setStatus(next);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unlink = useCallback(async () => {
    if (!userId) return;
    await repository.unlink(userId);
    await refresh();
  }, [userId, refresh]);

  return { status, loading, refresh, unlink };
}
