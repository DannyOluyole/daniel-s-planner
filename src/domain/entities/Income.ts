/**
 * How often this income actually repeats. "monthly" uses `dayOfMonth`;
 * "biweekly"/"weekly" use `anchorDate` instead, since a repeating N-day
 * cycle needs a real reference date to be unambiguous ("day 15" means
 * nothing for "every other Friday").
 */
export type IncomeFrequency = "monthly" | "biweekly" | "weekly";

/**
 * A recurring income line (a paycheck, freelance retainer, etc.). Sits
 * opposite Commitments: together they're what Available is derived from in
 * local/demo mode — Income minus Protected minus what's already been spent
 * this month.
 */
export interface Income {
  id: string;
  userId: string;
  name: string;
  amountCents: number;
  /** Defaults to "monthly" when absent — every row created before this
   * field existed keeps its exact prior behavior unchanged. */
  frequency?: IncomeFrequency;
  /** 1-31. Only meaningful when frequency is "monthly" — undefined means
   * unscheduled, treated as day 1 by the Financial Timeline. */
  dayOfMonth?: number;
  /** YYYY-MM-DD. Only meaningful when frequency is "biweekly"/"weekly" — a
   * real past-or-future payday the N-day cycle counts from. */
  anchorDate?: string;
  /** Also doubles as "active from" for month-scoped math on Home. */
  createdAt: string;
  /** Set when removed, instead of deleting the row — see Commitment.removedAt. */
  removedAt?: string;
}

export interface IncomeInput {
  name: string;
  amountCents: number;
  frequency?: IncomeFrequency;
  dayOfMonth?: number;
  anchorDate?: string;
}
