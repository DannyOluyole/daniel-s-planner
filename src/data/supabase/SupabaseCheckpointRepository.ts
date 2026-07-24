import { supabase } from "@core/config/supabase";
import { CheckpointRepository } from "@domain/repositories/CheckpointRepository";
import {
  MoneyState,
  SpendingDecision,
  SpendingDecisionInput,
  DecisionOutcome,
} from "@domain/entities/MoneyState";
import { SavingsGoal, SavingsGoalInput } from "@domain/entities/SavingsGoal";
import { Commitment, CommitmentInput } from "@domain/entities/Commitment";
import { Income, IncomeInput } from "@domain/entities/Income";
import { applyPurchase } from "@domain/money/applyPurchase";
import { sumActiveDuringMonth } from "@domain/money/activeDuringMonth";
import { sumContinuedThisMonth } from "@domain/money/categoryImpact";

/**
 * Concrete Supabase-backed implementation.
 * Table shapes (suggested):
 *
 * money_states(user_id uuid, available_cents int, protected_cents int,
 *              future_you_cents int, as_of timestamptz)
 *
 * spending_decisions(id uuid default gen_random_uuid(), user_id uuid,
 *              amount_cents int, merchant text, category text,
 *              outcome text, pause_duration_ms int, pause_reason text,
 *              decided_at timestamptz)
 *
 * savings_goals(id uuid default gen_random_uuid(), user_id uuid,
 *              name text, target_cents int, target_date date, created_at timestamptz,
 *              removed_at timestamptz)
 *
 * commitments(id uuid default gen_random_uuid(), user_id uuid, name text,
 *              type text check (type in ('fixed','variable','debt')), category text,
 *              amount_cents int, created_at timestamptz, removed_at timestamptz)
 *
 * income(id uuid default gen_random_uuid(), user_id uuid, name text,
 *              amount_cents int, created_at timestamptz, removed_at timestamptz)
 *
 * removed_at is set instead of deleting the row on remove — a past month
 * where the item was genuinely active shouldn't lose it just because it
 * was removed later. See @domain/money/activeDuringMonth.
 */
export class SupabaseCheckpointRepository implements CheckpointRepository {
  async getMoneyState(userId: string): Promise<MoneyState> {
    const { data: plaidItem, error: plaidError } = await supabase
      .from("plaid_items")
      .select("status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (plaidError) throw plaidError;
    const isBankLinked = plaidItem?.status === "linked";

    if (isBankLinked) {
      const { data, error } = await supabase
        .from("money_states")
        .select("available_cents, protected_cents, future_you_cents, as_of")
        .eq("user_id", userId)
        .order("as_of", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        return {
          availableCents: data.available_cents,
          protectedCents: data.protected_cents,
          futureYouCents: data.future_you_cents,
          asOf: data.as_of,
        };
      }
      // Linked, but the first sync hasn't landed a snapshot yet — fall
      // through to the live derivation below rather than leaving the
      // caller with nothing.
    }

    // No bank linked (or a just-linked account with no synced snapshot
    // yet) — derive live from income, commitments, and this month's
    // decisions, the same formula Home uses for the non-bank-linked case.
    // Nothing ever seeds a first money_states row for a user who never
    // links a bank, so the old unconditional read threw on every call for
    // them (PostgREST's `.single()` errors on zero rows) and left Decision
    // Mode's entire narrative/score blank, permanently, for anyone who
    // skipped bank-linking.
    const [commitments, income, decisions] = await Promise.all([
      this.getCommitments(userId),
      this.getIncome(userId),
      this.getRecentDecisions(userId, 200),
    ]);
    const now = new Date();
    const protectedCents = sumActiveDuringMonth(commitments, now);
    const totalIncomeCents = sumActiveDuringMonth(income, now);
    const spentThisMonth = sumContinuedThisMonth(decisions, now);
    return {
      availableCents: totalIncomeCents - protectedCents - spentThisMonth,
      protectedCents,
      futureYouCents: 0,
      asOf: now.toISOString(),
    };
  }

  async recordDecision(
    userId: string,
    input: SpendingDecisionInput,
    outcome: DecisionOutcome,
    pauseDurationMs: number,
    pauseReason?: string
  ): Promise<SpendingDecision> {
    const { data, error } = await supabase
      .from("spending_decisions")
      .insert({
        user_id: userId,
        amount_cents: input.amountCents,
        merchant: input.merchant,
        category: input.category ?? null,
        outcome,
        pause_duration_ms: pauseDurationMs,
        pause_reason: pauseReason ?? null,
        decided_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // A completed purchase actually spends money — record the debit as a
    // fresh money_states snapshot. Paused/reconsidered decisions never
    // touch the numbers.
    if (outcome === "continued") {
      const current = await this.getMoneyState(userId);
      const next = applyPurchase(current, input.amountCents);
      const { error: insertError } = await supabase.from("money_states").insert({
        user_id: userId,
        available_cents: next.availableCents,
        protected_cents: next.protectedCents,
        future_you_cents: next.futureYouCents,
        as_of: next.asOf,
      });
      if (insertError) throw insertError;
    }

    return {
      id: data.id,
      amountCents: data.amount_cents,
      merchant: data.merchant,
      category: data.category ?? undefined,
      outcome: data.outcome,
      pauseDurationMs: data.pause_duration_ms,
      pauseReason: data.pause_reason ?? undefined,
      decidedAt: data.decided_at,
    };
  }

  async getRecentDecisions(
    userId: string,
    limit = 20
  ): Promise<SpendingDecision[]> {
    const { data, error } = await supabase
      .from("spending_decisions")
      .select("*")
      .eq("user_id", userId)
      .order("decided_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      amountCents: row.amount_cents,
      merchant: row.merchant,
      category: row.category ?? undefined,
      outcome: row.outcome,
      pauseDurationMs: row.pause_duration_ms,
      pauseReason: row.pause_reason ?? undefined,
      decidedAt: row.decided_at,
    }));
  }

  async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    const { data, error } = await supabase
      .from("savings_goals")
      .select("id, user_id, name, target_cents, target_date, created_at, removed_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      targetCents: row.target_cents,
      targetDate: row.target_date ?? undefined,
      createdAt: row.created_at,
      removedAt: row.removed_at ?? undefined,
    }));
  }

  async addSavingsGoal(userId: string, input: SavingsGoalInput): Promise<SavingsGoal> {
    const { data, error } = await supabase
      .from("savings_goals")
      .insert({
        user_id: userId,
        name: input.name,
        target_cents: input.targetCents,
        target_date: input.targetDate ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      targetCents: data.target_cents,
      targetDate: data.target_date ?? undefined,
      createdAt: data.created_at,
    };
  }

  async updateSavingsGoal(userId: string, id: string, input: SavingsGoalInput): Promise<SavingsGoal> {
    const { data, error } = await supabase
      .from("savings_goals")
      .update({
        name: input.name,
        target_cents: input.targetCents,
        target_date: input.targetDate ?? null,
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      targetCents: data.target_cents,
      targetDate: data.target_date ?? undefined,
      createdAt: data.created_at,
    };
  }

  async removeSavingsGoal(userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from("savings_goals")
      .update({ removed_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("id", id)
      .is("removed_at", null);

    if (error) throw error;
  }

  async getCommitments(userId: string): Promise<Commitment[]> {
    // Returns removed rows too (removed_at set, not deleted) — Home needs
    // the full history to compute past months correctly; it filters to
    // currently-active ones itself for the editable list.
    const { data, error } = await supabase
      .from("commitments")
      .select("id, user_id, name, type, category, amount_cents, day_of_month, created_at, removed_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      category: row.category ?? undefined,
      amountCents: row.amount_cents,
      dayOfMonth: row.day_of_month ?? undefined,
      createdAt: row.created_at,
      removedAt: row.removed_at ?? undefined,
    }));
  }

  async addCommitment(userId: string, input: CommitmentInput): Promise<Commitment> {
    const { data, error } = await supabase
      .from("commitments")
      .insert({
        user_id: userId,
        name: input.name,
        type: input.type,
        category: input.category ?? null,
        amount_cents: input.amountCents,
        day_of_month: input.dayOfMonth ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      category: data.category ?? undefined,
      amountCents: data.amount_cents,
      dayOfMonth: data.day_of_month ?? undefined,
      createdAt: data.created_at,
    };
  }

  async removeCommitment(userId: string, id: string): Promise<void> {
    // Soft-delete: stops counting going forward, but a past month where
    // this was genuinely active keeps seeing it.
    const { error } = await supabase
      .from("commitments")
      .update({ removed_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("id", id)
      .is("removed_at", null);

    if (error) throw error;
  }

  async getIncome(userId: string): Promise<Income[]> {
    const { data, error } = await supabase
      .from("income")
      .select("id, user_id, name, amount_cents, frequency, day_of_month, anchor_date, created_at, removed_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      amountCents: row.amount_cents,
      frequency: (row.frequency as Income["frequency"]) ?? undefined,
      dayOfMonth: row.day_of_month ?? undefined,
      anchorDate: row.anchor_date ?? undefined,
      createdAt: row.created_at,
      removedAt: row.removed_at ?? undefined,
    }));
  }

  async addIncome(userId: string, input: IncomeInput): Promise<Income> {
    const { data, error } = await supabase
      .from("income")
      .insert({
        user_id: userId,
        name: input.name,
        amount_cents: input.amountCents,
        frequency: input.frequency ?? "monthly",
        day_of_month: input.dayOfMonth ?? null,
        anchor_date: input.anchorDate ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      amountCents: data.amount_cents,
      frequency: (data.frequency as Income["frequency"]) ?? undefined,
      dayOfMonth: data.day_of_month ?? undefined,
      anchorDate: data.anchor_date ?? undefined,
      createdAt: data.created_at,
    };
  }

  async removeIncome(userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from("income")
      .update({ removed_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("id", id)
      .is("removed_at", null);
    if (error) throw error;
  }

  async getFutureVision(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("future_visions")
      .select("text")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data?.text ?? null;
  }

  async setFutureVision(userId: string, text: string): Promise<void> {
    const { error } = await supabase
      .from("future_visions")
      .upsert({ user_id: userId, text }, { onConflict: "user_id" });
    if (error) throw error;
  }
}
