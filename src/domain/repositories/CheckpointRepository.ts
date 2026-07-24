import {
  MoneyState,
  SpendingDecision,
  SpendingDecisionInput,
  DecisionOutcome,
} from "@domain/entities/MoneyState";
import { SavingsGoal, SavingsGoalInput } from "@domain/entities/SavingsGoal";
import { Commitment, CommitmentInput } from "@domain/entities/Commitment";
import { Income, IncomeInput } from "@domain/entities/Income";

/**
 * Boundary between the domain and any concrete data source (Supabase today,
 * a bank-aggregator SDK tomorrow). Screens and hooks depend on this
 * interface, never on Supabase directly.
 */
export interface CheckpointRepository {
  getMoneyState(userId: string): Promise<MoneyState>;
  /**
   * Records the outcome of a Checkpoint. When `outcome` is `"continued"`,
   * implementations also debit `availableCents` by `input.amountCents` —
   * for a user with no bank linked, this is the only thing that keeps
   * Available honest (Plaid sync recomputes it independently).
   */
  recordDecision(
    userId: string,
    input: SpendingDecisionInput,
    outcome: DecisionOutcome,
    pauseDurationMs: number,
    pauseReason?: string
  ): Promise<SpendingDecision>;
  getRecentDecisions(userId: string, limit?: number): Promise<SpendingDecision[]>;
  /** Returns every goal including removed ones (removedAt set) — callers
   * filter to active goals themselves, same convention as getCommitments. */
  getSavingsGoals(userId: string): Promise<SavingsGoal[]>;
  addSavingsGoal(userId: string, input: SavingsGoalInput): Promise<SavingsGoal>;
  updateSavingsGoal(userId: string, id: string, input: SavingsGoalInput): Promise<SavingsGoal>;
  removeSavingsGoal(userId: string, id: string): Promise<void>;
  getCommitments(userId: string): Promise<Commitment[]>;
  addCommitment(userId: string, input: CommitmentInput): Promise<Commitment>;
  removeCommitment(userId: string, id: string): Promise<void>;
  getIncome(userId: string): Promise<Income[]>;
  addIncome(userId: string, input: IncomeInput): Promise<Income>;
  removeIncome(userId: string, id: string): Promise<void>;
  /** The "Future Self" concept — a short, free-text answer to "what does
   * financial freedom look like to you," referenced back in Decision Mode.
   * Null when never set. */
  getFutureVision(userId: string): Promise<string | null>;
  setFutureVision(userId: string, text: string): Promise<void>;
}
