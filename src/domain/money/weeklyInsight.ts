import { SpendingDecision } from "@domain/entities/MoneyState";

export interface WeeklyInsight {
  category: string;
  spentCents: number;
  /** How many separate purchases made up that total. */
  count: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The category with the most completed spending over the trailing 7 days —
 * the seed of Stage-2-style awareness nudges ("You've spent $28 on coffee
 * this week") computed purely from the user's own decision log, no bank
 * connection needed. Returns null when there's nothing to say, so callers
 * can simply not render rather than show an empty stat.
 */
export function topCategoryThisWeek(
  decisions: SpendingDecision[],
  now: Date = new Date()
): WeeklyInsight | null {
  const cutoff = now.getTime() - WEEK_MS;
  const totals = new Map<string, { spentCents: number; count: number }>();

  for (const d of decisions) {
    if (d.outcome !== "continued" || !d.category) continue;
    const at = new Date(d.decidedAt).getTime();
    if (at < cutoff || at > now.getTime()) continue;
    const entry = totals.get(d.category) ?? { spentCents: 0, count: 0 };
    entry.spentCents += d.amountCents;
    entry.count += 1;
    totals.set(d.category, entry);
  }

  let best: WeeklyInsight | null = null;
  for (const [category, { spentCents, count }] of totals) {
    if (!best || spentCents > best.spentCents) {
      best = { category, spentCents, count };
    }
  }
  return best;
}
