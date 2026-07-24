/**
 * A user-set target for Future You — what the Wall checks a purchase
 * against to decide whether it dips into savings, not just whether it
 * clears Available.
 */
export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetCents: number;
  targetDate?: string;
  createdAt: string;
  /** Set when removed, instead of deleting the row — see Commitment.removedAt. */
  removedAt?: string;
}

export interface SavingsGoalInput {
  name: string;
  targetCents: number;
  targetDate?: string;
}
