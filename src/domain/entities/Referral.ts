/**
 * A user's own referral standing: their invite code, how many people have
 * redeemed it, and Premium days banked from both sides of the loop (sending
 * and redeeming). Premium itself doesn't exist yet — see monetization
 * tiers — so premiumDaysEarned is a ledger balance that starts counting
 * down the day Premium ships, not something redeemable today.
 */
export interface ReferralSummary {
  code: string;
  invitesSent: number;
  premiumDaysEarned: number;
}

export type RedeemReferralError = "invalid_code" | "self_referral" | "already_used" | "unavailable" | "unknown";

export type RedeemReferralResult =
  | { ok: true; premiumDaysEarned: number }
  | { ok: false; error: RedeemReferralError };
