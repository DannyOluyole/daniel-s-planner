import { SavingsGoal } from "@domain/entities/SavingsGoal";

export interface FinancialConfidenceChecks {
  /** No shortfall before the next scheduled paycheck (see financialTimeline.ts). */
  billsCovered: boolean;
  /** No active goal has already been dipped below by the current balance —
   * true automatically when there are no active goals to check against. */
  savingsOnTrack: boolean;
  /** No variable-category budget is currently over, this month. */
  spendingWithinBudget: boolean;
}

export interface FinancialConfidence {
  /** 0-100. Not a credit score and not the per-purchase Financial Alignment
   * Score in Decision Mode — this is a whole-month read of "am I living
   * within the plan I set up," not a judgment on one purchase. */
  score: number;
  label: string;
  checks: FinancialConfidenceChecks;
}

// Weighted so failing any single check still reads as a real dip, but
// perfection isn't required for a clearly "stable" score — matches the
// spirit of the three checks together mattering more than any one alone.
const BILLS_WEIGHT = 35;
const SAVINGS_WEIGHT = 35;
const BUDGET_WEIGHT = 30;

/**
 * A monthly checklist score, not a per-purchase one — "am I currently
 * living within the plan I set up," built entirely from signals the app
 * already computes elsewhere (the Financial Timeline's shortfall check,
 * each active savings goal's threshold, and category budget status), never
 * from debt or a credit bureau.
 */
export function computeFinancialConfidence(
  availableCents: number,
  goals: SavingsGoal[],
  anyCategoryOverBudget: boolean,
  causesShortfall: boolean
): FinancialConfidence {
  const activeGoals = goals.filter((g) => !g.removedAt);
  const billsCovered = !causesShortfall;
  const savingsOnTrack = activeGoals.length === 0 || activeGoals.every((g) => availableCents >= g.targetCents);
  const spendingWithinBudget = !anyCategoryOverBudget;

  let score = 100;
  if (!billsCovered) score -= BILLS_WEIGHT;
  if (!savingsOnTrack) score -= SAVINGS_WEIGHT;
  if (!spendingWithinBudget) score -= BUDGET_WEIGHT;
  score = Math.max(0, score);

  const label =
    score >= 80
      ? "You're financially stable this month."
      : score >= 60
      ? "Mostly on track, a few things to watch."
      : score >= 40
      ? "A few things need attention."
      : "Multiple things need attention this month.";

  return {
    score,
    label,
    checks: { billsCovered, savingsOnTrack, spendingWithinBudget },
  };
}
