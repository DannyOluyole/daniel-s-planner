import { MoneyState } from "@domain/entities/MoneyState";
import { SavingsGoal } from "@domain/entities/SavingsGoal";

/**
 * Debits a completed purchase from Available. This is the one place a
 * manually-logged decision actually changes the numbers — Plaid sync
 * recomputes MoneyState independently, but for a user with no bank linked
 * this is the only path that keeps Available honest.
 */
export function applyPurchase(state: MoneyState, amountCents: number): MoneyState {
  return {
    ...state,
    availableCents: state.availableCents - amountCents,
    asOf: new Date().toISOString(),
  };
}

export type WallTone = "ok" | "warn";

export interface WallVerdict {
  beforeCents: number;
  afterCents: number;
  /** 0 when the purchase doesn't dip below the savings goal target. */
  dipsIntoGoalBy: number;
  tone: WallTone;
}

/**
 * Pure ledger math behind the Checkpoint screen: what Available looks like
 * before/after, and whether this purchase eats into the savings goal.
 * Deliberately returns numbers only, no copy — message text is composed at
 * the UI layer from `Copy`, keeping this module framework- and vocabulary-free.
 */
export function computeWallVerdict(
  state: MoneyState,
  amountCents: number,
  savingsGoalTargetCents: number | null
): WallVerdict {
  const beforeCents = state.availableCents;
  const afterCents = beforeCents - amountCents;

  if (savingsGoalTargetCents != null && afterCents < savingsGoalTargetCents) {
    return {
      beforeCents,
      afterCents,
      dipsIntoGoalBy: savingsGoalTargetCents - afterCents,
      tone: "warn",
    };
  }

  return { beforeCents, afterCents, dipsIntoGoalBy: 0, tone: "ok" };
}

/**
 * With multiple goals active, a purchase can dip below several of their
 * targets at once. Picks the one whose target is nearest to (just above)
 * the post-purchase balance — the threshold a shrinking balance crosses
 * first, and the most concrete one to warn about. Returns null when the
 * purchase doesn't dip into any active goal.
 */
export function selectDippedGoal(goals: SavingsGoal[], afterCents: number): SavingsGoal | null {
  const dipped = goals.filter((g) => !g.removedAt && afterCents < g.targetCents);
  if (dipped.length === 0) return null;
  return dipped.reduce((nearest, g) => (g.targetCents < nearest.targetCents ? g : nearest));
}
