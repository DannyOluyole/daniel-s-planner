/**
 * Something the user has already set aside for — a recurring bill (fixed),
 * a flexible monthly budget for a category (variable), or a debt payment
 * (behaves like fixed: same amount, no category). Together these are what
 * "Protected" actually itemizes, and what the Wall checks a new purchase's
 * category against, in addition to the savings goal.
 */
export type CommitmentType = "fixed" | "variable" | "debt";

export interface Commitment {
  id: string;
  userId: string;
  name: string;
  type: CommitmentType;
  /** Only meaningful for "variable" — lets the Wall match a purchase's
   * category (e.g. "Dining") against a budgeted amount. */
  category?: string;
  amountCents: number;
  /** 1-31. When it's due each month (fixed/debt) or typically spent
   * (variable) — undefined means unscheduled, treated as day 1 by the
   * Financial Timeline. */
  dayOfMonth?: number;
  /** Also doubles as "active from" for month-scoped math on Home. */
  createdAt: string;
  /** Set when removed, instead of deleting the row — a past month where
   * this was genuinely active shouldn't lose it just because it was
   * removed later. Null/undefined means still active. */
  removedAt?: string;
}

export interface CommitmentInput {
  name: string;
  type: CommitmentType;
  category?: string;
  amountCents: number;
  dayOfMonth?: number;
}
