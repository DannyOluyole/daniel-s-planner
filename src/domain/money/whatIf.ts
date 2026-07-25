import { Income } from "@domain/entities/Income";
import { Commitment } from "@domain/entities/Commitment";
import { money } from "@domain/entities/MoneyState";
import { buildFinancialTimeline, computeSafeSpendingDays } from "./financialTimeline";

/** Parses a YYYY-MM-DD timeline date key back into local month/day words —
 * never through `new Date(string)`, which parses as UTC and can print a
 * day early or late depending on the device's timezone. */
function formatDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export interface WhatIfOutcome {
  headline: string;
  scenarioDailyAllowanceCents: number | null;
  scenarioDaysUntilPayday: number | null;
  scenarioCausesShortfall: boolean;
}

/**
 * "What if I saved/spent $X more a month?" — scoped deliberately: this
 * answers a monthly cash-flow change, not full life-event simulation (a job
 * loss or a move needs assumptions — severance, a new rent figure — this
 * app has no basis to invent). Reuses the existing Financial Timeline
 * engine rather than a separate simulation model: the delta becomes a
 * synthetic recurring income row (positive — more money each month) or
 * commitment row (negative — less), injected alongside the user's real
 * income/commitments for one what-if projection.
 */
export function buildWhatIfOutcome(
  monthlyChangeCents: number,
  availableCents: number,
  income: Income[],
  commitments: Commitment[],
  now: Date = new Date(),
  horizonDays = 45
): WhatIfOutcome {
  const dayOfMonth = now.getDate();
  const extraIncome: Income[] =
    monthlyChangeCents > 0
      ? [
          {
            id: "what-if-delta",
            userId: "",
            name: "What if",
            amountCents: monthlyChangeCents,
            dayOfMonth,
            createdAt: now.toISOString(),
          },
        ]
      : [];
  const extraCommitments: Commitment[] =
    monthlyChangeCents < 0
      ? [
          {
            id: "what-if-delta",
            userId: "",
            name: "What if",
            type: "fixed",
            amountCents: Math.abs(monthlyChangeCents),
            dayOfMonth,
            createdAt: now.toISOString(),
          },
        ]
      : [];

  const timeline = buildFinancialTimeline(
    availableCents,
    [...income, ...extraIncome],
    [...commitments, ...extraCommitments],
    null,
    now,
    horizonDays
  );
  const safeSpendingDays = computeSafeSpendingDays(availableCents, timeline, now);

  const verb = monthlyChangeCents >= 0 ? "saved" : "spent";
  const amount = money(Math.abs(monthlyChangeCents));
  const changeLabel = `${verb} ${amount} more a month`;

  let headline: string;
  if (monthlyChangeCents === 0) {
    headline = "Nothing changes if you keep things exactly as they are.";
  } else if (timeline.causesShortfall) {
    headline = timeline.lowestBalanceDate
      ? `Even if you ${changeLabel}, you'd still run short before ${formatDateKey(timeline.lowestBalanceDate)}.`
      : `Even if you ${changeLabel}, you'd still run short before your next paycheck.`;
  } else if (safeSpendingDays.dailyAllowanceCents != null) {
    headline = `If you ${changeLabel}, you'd have about ${money(
      safeSpendingDays.dailyAllowanceCents
    )} a day until your next paycheck.`;
  } else {
    headline = `If you ${changeLabel}, your cash flow stays comfortably positive.`;
  }

  return {
    headline,
    scenarioDailyAllowanceCents: safeSpendingDays.dailyAllowanceCents,
    scenarioDaysUntilPayday: safeSpendingDays.daysUntilPayday,
    scenarioCausesShortfall: timeline.causesShortfall,
  };
}
