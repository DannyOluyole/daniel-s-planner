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
