import { useCallback, useEffect, useState } from "react";
import { Transaction } from "@domain/entities/Transaction";
import { bankLinkRepository as repository } from "@data/repositories";

export function useTransactions(userId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const next = await repository.getTransactions(userId);
      setTransactions(next);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { transactions, loading, refresh };
}
