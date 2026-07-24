import { Income } from "@domain/entities/Income";
import { Commitment } from "@domain/entities/Commitment";

export type TimelineEventKind = "income" | "commitment" | "hypothetical";

export interface TimelineEvent {
  /** YYYY-MM-DD, always constructed from local date parts — never through
   * Date#toISOString, which converts to UTC and can silently shift the
   * date by a day depending on the device's timezone. */
  date: string;
  label: string;
  /** Positive = money in, negative = money out — the intuitive direction
   * for a running balance, deliberately the opposite of Plaid's own
   * "positive = spent" convention used elsewhere in this app. */
  amountCents: number;
  kind: TimelineEventKind;
}

export interface FinancialTimeline {
  events: TimelineEvent[];
  /** Running balance immediately after each event, same order as events. */
  runningBalances: number[];
  lowestBalanceCents: number;
  lowestBalanceDate: string | null;
  /** True when the balance would go negative at some point before the next
   * scheduled income — the real "can I actually afford this before payday"
   * check, sharper than a same-month snapshot. */
  causesShortfall: boolean;
}

interface HypotheticalPurchase {
  name: string;
  amountCents: number;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Clamps a day-of-month to whatever the target month actually has (e.g. a
 * "31st" bill in a 30-day month lands on the 30th instead of overflowing
 * into the next month). */
function dateForDay(year: number, month: number, day: number): Date {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, daysInMonth));
}

/** Every occurrence of a monthly-recurring day-of-month between `from`
 * (inclusive) and `horizonEnd` (inclusive) — usually one, sometimes two for
 * a long horizon or a day-of-month early in the cycle. */
function occurrencesWithinHorizon(dayOfMonth: number | undefined, from: Date, horizonEnd: Date): Date[] {
  const day = dayOfMonth ?? 1;
  const dates: Date[] = [];
  // Compared against a date-only version of `from`, not `from` itself —
  // `candidate` is always midnight, so comparing it against the exact
  // current timestamp (e.g. 2:32pm) would wrongly conclude "today already
  // passed" whenever today genuinely is the recurring day, silently
  // skipping it to next month.
  const fromDateOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let candidate = dateForDay(from.getFullYear(), from.getMonth(), day);
  if (candidate < fromDateOnly) {
    candidate = dateForDay(from.getFullYear(), from.getMonth() + 1, day);
  }
  while (candidate <= horizonEnd) {
    dates.push(candidate);
    candidate = dateForDay(candidate.getFullYear(), candidate.getMonth() + 1, day);
  }
  return dates;
}

/** Steps a date forward by a whole number of days via setDate/getDate
 * (calendar components), not raw millisecond arithmetic — a DST transition
 * can make a day either 23 or 25 hours long, so adding `days * 86400000` ms
 * can land an hour off from local midnight and silently shift the date. */
function stepDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Every occurrence of a fixed-interval recurrence (biweekly = 14 days,
 * weekly = 7) counted forward from a real anchor date — unlike a monthly
 * day-of-month, "every other Friday" has no self-describing single number,
 * so it needs a genuine reference date to stay unambiguous. */
function occurrencesFromAnchor(anchorDateKey: string, intervalDays: number, from: Date, horizonEnd: Date): Date[] {
  const [ay, am, ad] = anchorDateKey.split("-").map(Number);
  let candidate = new Date(ay, am - 1, ad);
  const fromDateOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  // Same same-day-inclusive care as occurrencesWithinHorizon — compare
  // against a date-only `from`, not the exact current timestamp.
  while (candidate < fromDateOnly) {
    candidate = stepDays(candidate, intervalDays);
  }

  const dates: Date[] = [];
  while (candidate <= horizonEnd) {
    dates.push(candidate);
    candidate = stepDays(candidate, intervalDays);
  }
  return dates;
}

/** Every occurrence of this income within the horizon, dispatching on its
 * frequency — "monthly" (the default, for every row that predates this
 * field) uses dayOfMonth; "biweekly"/"weekly" use anchorDate instead. Falls
 * back to monthly if a biweekly/weekly item has no anchor date yet. */
function occurrencesForIncome(item: Income, from: Date, horizonEnd: Date): Date[] {
  if (item.frequency === "biweekly" && item.anchorDate) {
    return occurrencesFromAnchor(item.anchorDate, 14, from, horizonEnd);
  }
  if (item.frequency === "weekly" && item.anchorDate) {
    return occurrencesFromAnchor(item.anchorDate, 7, from, horizonEnd);
  }
  return occurrencesWithinHorizon(item.dayOfMonth, from, horizonEnd);
}

/**
 * Projects income and dated commitments (fixed bills, debt payments —
 * variable budgets have no single "due date" so they're excluded) forward
 * from today, computing a running balance day by day. Optionally simulates
 * adding a hypothetical purchase today, which is how Decision Mode asks
 * "does this actually fit before my next paycheck" instead of just
 * checking this month's totals.
 */
export function buildFinancialTimeline(
  availableCents: number,
  income: Income[],
  commitments: Commitment[],
  hypotheticalPurchase: HypotheticalPurchase | null,
  now: Date = new Date(),
  horizonDays = 45
): FinancialTimeline {
  const horizonEnd = new Date(now.getTime() + horizonDays * DAY_MS);
  const events: TimelineEvent[] = [];

  for (const item of income.filter((i) => !i.removedAt)) {
    for (const date of occurrencesForIncome(item, now, horizonEnd)) {
      events.push({ date: toDateKey(date), label: item.name, amountCents: item.amountCents, kind: "income" });
    }
  }

  for (const item of commitments.filter((c) => !c.removedAt && c.type !== "variable")) {
    for (const date of occurrencesWithinHorizon(item.dayOfMonth, now, horizonEnd)) {
      events.push({ date: toDateKey(date), label: item.name, amountCents: -item.amountCents, kind: "commitment" });
    }
  }

  if (hypotheticalPurchase) {
    events.push({
      date: toDateKey(now),
      label: hypotheticalPurchase.name,
      amountCents: -hypotheticalPurchase.amountCents,
      kind: "hypothetical",
    });
  }

  // Stable chronological order; same-day events keep insertion order
  // (income before bills before the hypothetical purchase reads naturally).
  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let balance = availableCents;
  const runningBalances: number[] = [];
  let lowestBalanceCents = availableCents;
  let lowestBalanceDate: string | null = null;

  for (const event of events) {
    balance += event.amountCents;
    runningBalances.push(balance);
    if (balance < lowestBalanceCents) {
      lowestBalanceCents = balance;
      lowestBalanceDate = event.date;
    }
  }

  const firstIncomeIndex = events.findIndex((e) => e.kind === "income");
  const relevantBalances = firstIncomeIndex === -1 ? runningBalances : runningBalances.slice(0, firstIncomeIndex + 1);
  const causesShortfall = relevantBalances.some((b) => b < 0);

  return { events, runningBalances, lowestBalanceCents, lowestBalanceDate, causesShortfall };
}

export interface SafeSpendingDays {
  /** Null when there's no scheduled income within the timeline's horizon —
   * nothing to count down to. */
  daysUntilPayday: number | null;
  /** Available spread evenly across the days until payday. Null whenever
   * that math wouldn't mean anything: no known payday, or already at/below
   * zero available (there's nothing to spread — that's the timeline's
   * shortfall warning's job, not this one's). */
  dailyAllowanceCents: number | null;
}

/**
 * Turns "how much is available" into "how long that actually lasts" — a
 * balance in isolation doesn't say whether $400 is plenty or barely enough;
 * $400 over 2 days reads very differently than $400 over 20.
 */
export function computeSafeSpendingDays(
  availableCents: number,
  timeline: FinancialTimeline,
  now: Date = new Date()
): SafeSpendingDays {
  const nextIncome = timeline.events.find((e) => e.kind === "income");
  if (!nextIncome) return { daysUntilPayday: null, dailyAllowanceCents: null };

  const [y, m, d] = nextIncome.date.split("-").map(Number);
  const incomeDate = new Date(y, m - 1, d);
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysUntilPayday = Math.max(1, Math.round((incomeDate.getTime() - todayDateOnly.getTime()) / DAY_MS));

  const dailyAllowanceCents = availableCents > 0 ? Math.floor(availableCents / daysUntilPayday) : null;

  return { daysUntilPayday, dailyAllowanceCents };
}
