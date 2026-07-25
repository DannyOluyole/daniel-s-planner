import { MoneyState } from "@domain/entities/MoneyState";

export interface FutureYouProjection {
  projectedCents: number;
  /** Positive = growing, negative = being drawn down — shown honestly
   * either way, never clamped to look better than the real trend. */
  monthlyTrendCents: number;
}

const DAY_MS = 1000 * 60 * 60 * 24;
// Need at least ~2 weeks between the earliest and latest snapshot for a
// "monthly rate" to mean anything — two snapshots an hour apart would turn
// tiny noise into a wildly exaggerated monthly trend.
const MIN_SPAN_DAYS = 14;

/**
 * A real trend from actual Future You balance history, not a guess. Takes
 * the earliest and latest snapshot in whatever window the caller passed in,
 * finds the monthly rate of change between them, and projects that rate
 * forward. Returns null when there isn't enough real history yet — fewer
 * than two snapshots, or they're too close together in time — so callers
 * can show an honest "not enough history yet" instead of a number that
 * isn't actually grounded in anything.
 */
export function computeFutureYouProjection(
  history: MoneyState[],
  horizonMonths = 12
): FutureYouProjection | null {
  if (history.length < 2) return null;

  const sorted = [...history].sort((a, b) => new Date(a.asOf).getTime() - new Date(b.asOf).getTime());
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];

  const spanDays = (new Date(newest.asOf).getTime() - new Date(oldest.asOf).getTime()) / DAY_MS;
  if (spanDays < MIN_SPAN_DAYS) return null;

  const spanMonths = spanDays / 30;
  const monthlyTrendCents = Math.round((newest.futureYouCents - oldest.futureYouCents) / spanMonths);
  const projectedCents = newest.futureYouCents + monthlyTrendCents * horizonMonths;

  return { projectedCents, monthlyTrendCents };
}
