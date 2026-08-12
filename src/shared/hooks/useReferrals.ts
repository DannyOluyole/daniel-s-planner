import { useCallback, useEffect, useState } from "react";
import { getReferralSummary, redeemReferralCode } from "@data/referrals";
import type { ReferralSummary, RedeemReferralResult } from "@domain/entities/Referral";

export function useReferrals(userId: string | null) {
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const next = await getReferralSummary(userId);
      setSummary(next);
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

  const redeem = useCallback(
    async (code: string): Promise<RedeemReferralResult> => {
      const result = await redeemReferralCode(code);
      if (result.ok) await refresh();
      return result;
    },
    [refresh]
  );

  return { summary, loading, error, refresh, redeem };
}
