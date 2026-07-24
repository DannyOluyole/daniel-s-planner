import { CheckpointRepository } from "@domain/repositories/CheckpointRepository";
import {
  DecisionOutcome,
  MoneyState,
  SpendingDecision,
  SpendingDecisionInput,
} from "@domain/entities/MoneyState";
import { SavingsGoal, SavingsGoalInput } from "@domain/entities/SavingsGoal";
import { Commitment, CommitmentInput } from "@domain/entities/Commitment";
import { Income, IncomeInput } from "@domain/entities/Income";
import { sumContinuedThisMonth } from "@domain/money/categoryImpact";
import {
  initialCommitments,
  initialDecisions,
  initialIncome,
  initialMoneyState,
  initialSavingsGoals,
} from "./fixtures";

interface UserRecord {
  moneyState: MoneyState;
  decisions: SpendingDecision[];
  savingsGoals: SavingsGoal[];
  commitments: Commitment[];
  income: Income[];
  futureVision: string | null;
}

/**
 * In-memory stand-in for CheckpointRepository, used only when Supabase
 * isn't configured (`supabaseConfigured` in @core/config/supabase). Lets
 * the whole app be click-through-able before a real project exists.
 * Resets on reload — not a substitute for real persistence.
 */
export class LocalCheckpointRepository implements CheckpointRepository {
  private records = new Map<string, UserRecord>();

  private recordFor(userId: string): UserRecord {
    let record = this.records.get(userId);
    if (!record) {
      record = {
        moneyState: { ...initialMoneyState },
        decisions: [...initialDecisions],
        savingsGoals: initialSavingsGoals.map((g) => ({ ...g, userId })),
        commitments: initialCommitments.map((c) => ({ ...c, userId })),
        income: initialIncome.map((i) => ({ ...i, userId })),
        futureVision: null,
      };
      this.records.set(userId, record);
    }
    return record;
  }

  async getMoneyState(userId: string): Promise<MoneyState> {
    const record = this.recordFor(userId);
    // Protected and Available are derived live from the user's own income,
    // commitments, and this month's decisions rather than stored as their
    // own numbers — add an expense or log a purchase on Home and this
    // reflects it immediately, no separate sync step. (A real bank
    // connection would get Available from the synced balance instead —
    // this derivation is only for the no-bank-linked path.)
    // Removed items are soft-deleted (removedAt set, not deleted outright)
    // so history stays intact — the real-time balance only counts what's
    // currently active, though.
    const protectedCents = record.commitments
      .filter((c) => !c.removedAt)
      .reduce((sum, c) => sum + c.amountCents, 0);
    const totalIncomeCents = record.income
      .filter((i) => !i.removedAt)
      .reduce((sum, i) => sum + i.amountCents, 0);
    const spentThisMonth = sumContinuedThisMonth(record.decisions);
    const availableCents = totalIncomeCents - protectedCents - spentThisMonth;
    return { ...record.moneyState, protectedCents, availableCents, asOf: new Date().toISOString() };
  }

  async recordDecision(
    userId: string,
    input: SpendingDecisionInput,
    outcome: DecisionOutcome,
    pauseDurationMs: number,
    pauseReason?: string
  ): Promise<SpendingDecision> {
    const record = this.recordFor(userId);
    const decision: SpendingDecision = {
      id: `local-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      amountCents: input.amountCents,
      merchant: input.merchant,
      category: input.category,
      outcome,
      pauseDurationMs,
      pauseReason,
      decidedAt: new Date().toISOString(),
    };
    // No separate debit step needed — getMoneyState recomputes Available
    // from this month's continued decisions on every read, and this one is
    // now in record.decisions for the next call to pick up.
    record.decisions = [decision, ...record.decisions];

    return decision;
  }

  async getRecentDecisions(userId: string, limit = 20): Promise<SpendingDecision[]> {
    return this.recordFor(userId).decisions.slice(0, limit);
  }

  async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    return this.recordFor(userId).savingsGoals;
  }

  async addSavingsGoal(userId: string, input: SavingsGoalInput): Promise<SavingsGoal> {
    const record = this.recordFor(userId);
    const goal: SavingsGoal = {
      id: `local-goal-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      userId,
      name: input.name,
      targetCents: input.targetCents,
      targetDate: input.targetDate,
      createdAt: new Date().toISOString(),
    };
    record.savingsGoals = [goal, ...record.savingsGoals];
    return goal;
  }

  async updateSavingsGoal(userId: string, id: string, input: SavingsGoalInput): Promise<SavingsGoal> {
    const record = this.recordFor(userId);
    let updated: SavingsGoal | undefined;
    record.savingsGoals = record.savingsGoals.map((g) => {
      if (g.id !== id) return g;
      updated = { ...g, name: input.name, targetCents: input.targetCents, targetDate: input.targetDate };
      return updated;
    });
    if (!updated) throw new Error(`Savings goal ${id} not found`);
    return updated;
  }

  async removeSavingsGoal(userId: string, id: string): Promise<void> {
    const record = this.recordFor(userId);
    record.savingsGoals = record.savingsGoals.map((g) =>
      g.id === id && !g.removedAt ? { ...g, removedAt: new Date().toISOString() } : g
    );
  }

  async getCommitments(userId: string): Promise<Commitment[]> {
    return this.recordFor(userId).commitments;
  }

  async addCommitment(userId: string, input: CommitmentInput): Promise<Commitment> {
    const record = this.recordFor(userId);
    const commitment: Commitment = {
      id: `local-commitment-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      userId,
      name: input.name,
      type: input.type,
      category: input.category,
      amountCents: input.amountCents,
      dayOfMonth: input.dayOfMonth,
      createdAt: new Date().toISOString(),
    };
    record.commitments = [commitment, ...record.commitments];
    return commitment;
  }

  async removeCommitment(userId: string, id: string): Promise<void> {
    const record = this.recordFor(userId);
    // Soft-delete: stops counting going forward, but a past month where
    // this was genuinely active keeps seeing it — see getCommitments and
    // activeDuringMonth.ts.
    record.commitments = record.commitments.map((c) =>
      c.id === id && !c.removedAt ? { ...c, removedAt: new Date().toISOString() } : c
    );
  }

  async getIncome(userId: string): Promise<Income[]> {
    return this.recordFor(userId).income;
  }

  async addIncome(userId: string, input: IncomeInput): Promise<Income> {
    const record = this.recordFor(userId);
    const income: Income = {
      id: `local-income-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      userId,
      name: input.name,
      amountCents: input.amountCents,
      frequency: input.frequency,
      dayOfMonth: input.dayOfMonth,
      anchorDate: input.anchorDate,
      createdAt: new Date().toISOString(),
    };
    record.income = [income, ...record.income];
    return income;
  }

  async removeIncome(userId: string, id: string): Promise<void> {
    const record = this.recordFor(userId);
    record.income = record.income.map((i) =>
      i.id === id && !i.removedAt ? { ...i, removedAt: new Date().toISOString() } : i
    );
  }

  async getFutureVision(userId: string): Promise<string | null> {
    return this.recordFor(userId).futureVision;
  }

  async setFutureVision(userId: string, text: string): Promise<void> {
    this.recordFor(userId).futureVision = text;
  }
}
