import { Transaction } from "@domain/entities/Transaction";

export interface CategorySpendInsight {
  category: string;
  spentCents: number;
  count: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * The category with the most real bank spend over the trailing 7 days —
 * unlike Home's topCategoryThisWeek (which only sees purchases the user
 * manually Checkpoint'd), this reads actual synced transactions, so it can
 * notice a pattern the user never logged. Only counts real debits (Plaid's
 * positive-amount convention) with a known category; returns null when
 * there's nothing worth saying.
 */
export function topCategoryThisWeekFromTransactions(
  transactions: Transaction[],
  now: Date = new Date()
): CategorySpendInsight | null {
  const cutoff = now.getTime() - WEEK_MS;
  const totals = new Map<string, { spentCents: number; count: number }>();

  for (const t of transactions) {
    if (t.amountCents <= 0 || !t.category) continue;
    const at = parseLocalDate(t.transactedAt).getTime();
    if (at < cutoff || at > now.getTime()) continue;
    const entry = totals.get(t.category) ?? { spentCents: 0, count: 0 };
    entry.spentCents += t.amountCents;
    entry.count += 1;
    totals.set(t.category, entry);
  }

  let best: CategorySpendInsight | null = null;
  for (const [category, { spentCents, count }] of totals) {
    if (!best || spentCents > best.spentCents) {
      best = { category, spentCents, count };
    }
  }
  return best;
}

export interface CategoryTrendFromTransactions {
  category: string;
  currentCents: number;
  previousCents: number;
  /** Rounded whole-percent change, e.g. 18 for +18%, -25 for a 25% drop. */
  percentChange: number;
  direction: "up" | "down";
}

const TREND_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const TREND_MIN_PREVIOUS_CENTS = 2000;
const TREND_MIN_PERCENT_CHANGE = 15;

/**
 * Transaction-backed twin of insightsEngine.ts's detectCategoryTrends —
 * same trailing-30-days-vs-previous-30-days comparison, same thresholds,
 * but reading real synced transactions instead of manually-logged
 * decisions, so it can catch a pattern the user never Checkpoint'd.
 */
export function detectCategoryTrendsFromTransactions(
  transactions: Transaction[],
  now: Date = new Date(),
  options: { minPreviousCents?: number; minPercentChange?: number } = {}
): CategoryTrendFromTransactions[] {
  const minPreviousCents = options.minPreviousCents ?? TREND_MIN_PREVIOUS_CENTS;
  const minPercentChange = options.minPercentChange ?? TREND_MIN_PERCENT_CHANGE;

  const nowMs = now.getTime();
  const currentStart = nowMs - TREND_WINDOW_MS;
  const previousStart = currentStart - TREND_WINDOW_MS;

  const current = new Map<string, number>();
  const previous = new Map<string, number>();

  for (const t of transactions) {
    if (t.amountCents <= 0 || !t.category) continue;
    const at = parseLocalDate(t.transactedAt).getTime();
    if (at >= currentStart && at <= nowMs) {
      current.set(t.category, (current.get(t.category) ?? 0) + t.amountCents);
    } else if (at >= previousStart && at < currentStart) {
      previous.set(t.category, (previous.get(t.category) ?? 0) + t.amountCents);
    }
  }

  const categories = new Set([...current.keys(), ...previous.keys()]);
  const trends: CategoryTrendFromTransactions[] = [];

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

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Which day of the week has actually seen the most spending historically —
 * real data behind the brief's "Fridays are usually your highest spending
 * day" line, which may or may not turn out to be true for a given user.
 * Returns null with fewer than 5 real purchases, since that's too little
 * history to say anything meaningful.
 */
export function highestSpendingWeekday(transactions: Transaction[]): string | null {
  const purchases = transactions.filter((t) => t.amountCents > 0);
  if (purchases.length < 5) return null;

  const totals = new Array(7).fill(0);
  for (const t of purchases) {
    const day = parseLocalDate(t.transactedAt).getDay();
    totals[day] += t.amountCents;
  }

  let bestDay = 0;
  for (let i = 1; i < 7; i++) {
    if (totals[i] > totals[bestDay]) bestDay = i;
  }
  if (totals[bestDay] === 0) return null;
  return WEEKDAY_NAMES[bestDay];
}
