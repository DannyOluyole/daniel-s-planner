import { Commitment } from "@domain/entities/Commitment";
import { SpendingDecision } from "@domain/entities/MoneyState";
import { CATEGORY_INTENT, Category, Intent } from "./parsePurchaseSpeech";

export interface CategoryBudgetImpact {
  category: string;
  budgetCents: number;
  spentBeforeCents: number;
  spentAfterCents: number;
  /** 0 when this purchase keeps the category's monthly budget intact. */
  overBy: number;
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/**
 * Checks a new purchase against the user's own variable-expense budget for
 * its category (set up on Home) — this is separate from, and in addition
 * to, the savings-goal check the Wall already does. Returns null when the
 * purchase has no category or nothing's budgeted for it, so the Wall can
 * simply omit the section rather than show a zeroed-out budget the user
 * never set. Passing `amountCents: 0` reports pure month-to-date standing
 * for a category with no new purchase — that's how Home's per-budget
 * "spent so far" line reuses this same function.
 */
export function summarizeCategoryImpact(
  commitments: Commitment[],
  decisions: SpendingDecision[],
  category: string | undefined,
  amountCents: number,
  now: Date = new Date()
): CategoryBudgetImpact | null {
  if (!category) return null;
  const budget = commitments.find(
    (c) => c.type === "variable" && c.category?.toLowerCase() === category.toLowerCase()
  );
  if (!budget) return null;

  const spentBeforeCents = decisions
    .filter(
      (d) =>
        d.outcome === "continued" &&
        d.category?.toLowerCase() === category.toLowerCase() &&
        isSameMonth(new Date(d.decidedAt), now)
    )
    .reduce((sum, d) => sum + d.amountCents, 0);

  const spentAfterCents = spentBeforeCents + amountCents;

  return {
    category: budget.category ?? category,
    budgetCents: budget.amountCents,
    spentBeforeCents,
    spentAfterCents,
    overBy: Math.max(0, spentAfterCents - budget.amountCents),
  };
}

/**
 * Total of this month's completed purchases, regardless of category — what
 * local/demo mode subtracts from Income minus Protected to get Available.
 * A real bank connection would get Available from the synced balance
 * instead; this is only for the no-bank-linked path.
 */
export function sumContinuedThisMonth(decisions: SpendingDecision[], now: Date = new Date()): number {
  return decisions
    .filter((d) => d.outcome === "continued" && isSameMonth(new Date(d.decidedAt), now))
    .reduce((sum, d) => sum + d.amountCents, 0);
}

export interface IntentSpend {
  intent: Intent;
  spentCents: number;
}

/**
 * This month's completed purchases grouped by intent (Investing in myself /
 * Lifestyle / Responsibilities) rather than raw category — "you invested
 * $340 in yourself this month" reads as a more meaningful reflection than
 * "Books: $200, Courses: $140" on their own. A decision with an unrecognized
 * or missing category folds into "Other" rather than being dropped.
 */
export function summarizeIntentThisMonth(decisions: SpendingDecision[], now: Date = new Date()): IntentSpend[] {
  const totals = new Map<Intent, number>();
  for (const d of decisions) {
    if (d.outcome !== "continued" || !isSameMonth(new Date(d.decidedAt), now)) continue;
    const intent = (d.category && CATEGORY_INTENT[d.category as Category]) || "Other";
    totals.set(intent, (totals.get(intent) ?? 0) + d.amountCents);
  }
  return Array.from(totals.entries()).map(([intent, spentCents]) => ({ intent, spentCents }));
}
