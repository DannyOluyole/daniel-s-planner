import { SavingsGoal } from "@domain/entities/SavingsGoal";
import { SpendingDecision } from "@domain/entities/MoneyState";

export type MilestoneKey = "first_goal_reached" | "first_protected_decision" | "30_days_of_use";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * "Reached" means the same thing here as it does in financialConfidence.ts's
 * savingsOnTrack check — available balance at or above the goal's target —
 * so a goal never reads as "on track" in one place and "not reached yet" in
 * another for the same numbers.
 */
export function detectFirstGoalReached(goals: SavingsGoal[], availableCents: number): SavingsGoal | null {
  const activeGoals = goals.filter((g) => !g.removedAt);
  return activeGoals.find((g) => availableCents >= g.targetCents) ?? null;
}

/**
 * The oldest paused/reconsidered decision in the list — callers pass full
 * history (not just a recent window) so this only ever fires once, the
 * first time it's true, regardless of how much has happened since.
 */
export function detectFirstProtectedDecision(decisions: SpendingDecision[]): SpendingDecision | null {
  const protectedDecisions = decisions.filter((d) => d.outcome === "paused" || d.outcome === "reconsidered");
  if (protectedDecisions.length === 0) return null;
  return protectedDecisions.reduce((oldest, d) =>
    new Date(d.decidedAt).getTime() < new Date(oldest.decidedAt).getTime() ? d : oldest
  );
}

/**
 * userCreatedAt is Supabase Auth's own session.user.created_at — no
 * app-specific "joined at" column exists or is needed for this check.
 */
export function detect30DaysOfUse(userCreatedAt: string | undefined, now: Date = new Date()): boolean {
  if (!userCreatedAt) return false;
  return now.getTime() - new Date(userCreatedAt).getTime() >= THIRTY_DAYS_MS;
}
