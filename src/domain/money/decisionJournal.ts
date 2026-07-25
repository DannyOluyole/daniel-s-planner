import { SpendingDecision } from "@domain/entities/MoneyState";

/**
 * Total of every paused/reconsidered decision passed in — "money protected"
 * framing from the Decision Journal concept: what NOT buying something is
 * worth, not just what was spent. Callers control the window (e.g. the
 * Decisions screen's own history limit) — this never filters by date itself.
 */
export function sumMoneyProtected(decisions: SpendingDecision[]): number {
  return decisions
    .filter((d) => d.outcome === "paused" || d.outcome === "reconsidered")
    .reduce((sum, d) => sum + d.amountCents, 0);
}

/**
 * The reason chip picked most often across paused/reconsidered decisions.
 * Null when nobody's ever left one — a blank Decision Journal isn't a tie.
 */
export function mostCommonPauseReason(decisions: SpendingDecision[]): string | null {
  const counts = new Map<string, number>();
  for (const d of decisions) {
    if (!d.pauseReason) continue;
    counts.set(d.pauseReason, (counts.get(d.pauseReason) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [reason, count] of counts) {
    if (count > bestCount) {
      best = reason;
      bestCount = count;
    }
  }
  return best;
}

export interface PauseReasonMatch {
  reason: string;
  merchant: string;
  matchedOn: "merchant" | "category";
}

/**
 * Looks for the most recent paused/reconsidered decision with a saved
 * reason that's relevant to what's being bought right now — an exact
 * merchant match first (most specific), falling back to the category.
 * Callers pass decisions already ordered newest-first (the convention
 * getRecentDecisions returns), so the first match found is the most recent.
 * Returns null when there's nothing relevant to bring back up.
 */
export function findRelevantPauseReason(
  decisions: SpendingDecision[],
  merchant: string,
  category: string | undefined
): PauseReasonMatch | null {
  const normalizedMerchant = merchant.trim().toLowerCase();
  const candidates = decisions.filter(
    (d) => (d.outcome === "paused" || d.outcome === "reconsidered") && d.pauseReason
  );

  const merchantMatch = candidates.find((d) => d.merchant.trim().toLowerCase() === normalizedMerchant);
  if (merchantMatch) {
    return { reason: merchantMatch.pauseReason!, merchant: merchantMatch.merchant, matchedOn: "merchant" };
  }

  if (category) {
    const categoryMatch = candidates.find((d) => d.category?.toLowerCase() === category.toLowerCase());
    if (categoryMatch) {
      return { reason: categoryMatch.pauseReason!, merchant: categoryMatch.merchant, matchedOn: "category" };
    }
  }

  return null;
}

export interface RegretMatch {
  merchant: string;
  matchedOn: "merchant" | "category";
}

/**
 * "Decision Memory" — looks for the most recent *completed* purchase the
 * user later marked as regretted, relevant to what's being bought right
 * now. Same merchant-first-then-category matching as
 * findRelevantPauseReason, but over a completely different signal: this
 * only considers "continued" decisions (you can't regret a purchase you
 * never went through with) that were flagged after the fact via
 * setDecisionRegretted. Returns null when there's nothing to gently
 * remember.
 */
export function findRegrettedPurchaseWarning(
  decisions: SpendingDecision[],
  merchant: string,
  category: string | undefined
): RegretMatch | null {
  const normalizedMerchant = merchant.trim().toLowerCase();
  const candidates = decisions.filter((d) => d.outcome === "continued" && d.regretted);

  const merchantMatch = candidates.find((d) => d.merchant.trim().toLowerCase() === normalizedMerchant);
  if (merchantMatch) {
    return { merchant: merchantMatch.merchant, matchedOn: "merchant" };
  }

  if (category) {
    const categoryMatch = candidates.find((d) => d.category?.toLowerCase() === category.toLowerCase());
    if (categoryMatch) {
      return { merchant: categoryMatch.merchant, matchedOn: "category" };
    }
  }

  return null;
}
