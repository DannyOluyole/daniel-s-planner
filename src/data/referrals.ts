import { supabase, supabaseConfigured } from "@core/config/supabase";
import type { ReferralSummary, RedeemReferralResult, RedeemReferralError } from "@domain/entities/Referral";

// Demo mode has no other real users to refer or be referred by, so the
// whole loop is inert here — a stable fake code so the screen still has
// something to show, sending/redeeming both no-op.
const DEMO_CODE = "DEMO01";

/**
 * Referrals are edge-function-gated writes (see supabase/functions/
 * referral-ensure-code and referral-redeem) rather than a full repository
 * pair like Challenges/SavingsGoals — there's no local/Supabase swap beyond
 * "does a backend exist at all," the same shape AuthContext already uses
 * for deleteAccount/clearData, so a full Repository interface here would
 * just be ceremony around two function calls and a couple of selects.
 */
export async function getReferralSummary(userId: string): Promise<ReferralSummary> {
  if (!supabaseConfigured) {
    return { code: DEMO_CODE, invitesSent: 0, premiumDaysEarned: 0 };
  }

  let code: string;
  const { data: existingCode, error: codeSelectError } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();
  if (codeSelectError) throw codeSelectError;

  if (existingCode) {
    code = existingCode.code as string;
  } else {
    const { data, error } = await supabase.functions.invoke("referral-ensure-code", { body: {} });
    if (error) throw error;
    code = (data as { code: string }).code;
  }

  const [invitesResult, rewardsResult] = await Promise.all([
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", userId),
    supabase.from("referral_rewards").select("premium_days").eq("user_id", userId),
  ]);
  if (invitesResult.error) throw invitesResult.error;
  if (rewardsResult.error) throw rewardsResult.error;

  const premiumDaysEarned = (rewardsResult.data ?? []).reduce(
    (sum, row) => sum + (row.premium_days as number),
    0
  );

  return { code, invitesSent: invitesResult.count ?? 0, premiumDaysEarned };
}

export async function redeemReferralCode(code: string): Promise<RedeemReferralResult> {
  if (!supabaseConfigured) {
    return { ok: false, error: "unavailable" };
  }
  try {
    const { data, error } = await supabase.functions.invoke("referral-redeem", { body: { code } });
    if (error) return { ok: false, error: "unknown" };
    const result = data as { ok: boolean; premiumDaysEarned?: number; error?: string };
    if (result.ok) {
      return { ok: true, premiumDaysEarned: result.premiumDaysEarned ?? 0 };
    }
    return { ok: false, error: (result.error as RedeemReferralError | undefined) ?? "unknown" };
  } catch {
    return { ok: false, error: "unknown" };
  }
}
