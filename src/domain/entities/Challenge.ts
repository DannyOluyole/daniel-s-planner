/**
 * An opt-in, time-boxed savings challenge. v1 supports one type
 * ("no_spend_week") — the field exists as a string, not a union, so adding
 * a second type later doesn't force a migration.
 */
export interface Challenge {
  id: string;
  userId: string;
  type: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  /** Set when removed, instead of deleting the row — see SavingsGoal.removedAt. */
  removedAt?: string;
}

export interface ChallengeInput {
  type: string;
  startsAt: string;
  endsAt: string;
}
