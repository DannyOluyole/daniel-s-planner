import { SpendingDecision } from "@domain/entities/MoneyState";

export interface CategoryTrend {
  category: string;
  currentCents: number;
  previousCents: number;
  /** Rounded whole-percent change, e.g. 18 for +18%, -25 for a 25% drop. */
  percentChange: number;
  direction: "up" | "down";
}

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
// A swing from $3 to $9 is technically "+200%" but isn't a real pattern —
// this floor keeps trends limited to categories with an actual habit behind them.
const DEFAULT_MIN_PREVIOUS_CENTS = 2000;
// Below this, month-to-month noise in ordinary spending would trigger a
// trend on nearly every category.
const DEFAULT_MIN_PERCENT_CHANGE = 15;

export interface DetectTrendsOptions {
  minPreviousCents?: number;
  minPercentChange?: number;
}

/**
 * Compares each category's spend in the trailing 30 days against the 30
 * days before that — two equal-length windows, so an early check-in mid-month
 * doesn't read as a false "decrease" just because less time has elapsed.
 * Surfaces only categories with both a meaningful baseline and a real swing,
 * sorted by how large the swing is. This is the "Dining increased 18%"
 * pattern-detection layer sitting next to weeklyInsight.ts's simpler
 * single-window "what did I spend most on" snapshot.
 */
export function detectCategoryTrends(
  decisions: SpendingDecision[],
  now: Date = new Date(),
  options: DetectTrendsOptions = {}
): CategoryTrend[] {
  const minPreviousCents = options.minPreviousCents ?? DEFAULT_MIN_PREVIOUS_CENTS;
  const minPercentChange = options.minPercentChange ?? DEFAULT_MIN_PERCENT_CHANGE;

  const nowMs = now.getTime();
  const currentStart = nowMs - WINDOW_MS;
  const previousStart = currentStart - WINDOW_MS;

  const current = new Map<string, number>();
  const previous = new Map<string, number>();

  for (const d of decisions) {
    if (d.outcome !== "continued" || !d.category) continue;
    const at = new Date(d.decidedAt).getTime();
    if (at >= currentStart && at <= nowMs) {
      current.set(d.category, (current.get(d.category) ?? 0) + d.amountCents);
    } else if (at >= previousStart && at < currentStart) {
      previous.set(d.category, (previous.get(d.category) ?? 0) + d.amountCents);
    }
  }

  const categories = new Set([...current.keys(), ...previous.keys()]);
  const trends: CategoryTrend[] = [];

  for (const category of categories) {
    const currentCents = current.get(category) ?? 0;
    const previousCents = previous.get(category) ?? 0;
    if (previousCents < minPreviousCents) continue;

    const percentChange = Math.round(((currentCents - previousCents) / previousCents) * 100);
    if (Math.abs(percentChange) < minPercentChange) continue;

    trends.push({
      category,
      currentCents,
      previousCents,
      percentChange,
      direction: percentChange > 0 ? "up" : "down",
    });
  }

  return trends.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
}
