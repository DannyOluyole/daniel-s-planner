import { supabase } from "@core/config/supabase";
import {
  BankConnectionStatus,
  BankLinkRepository,
} from "@domain/repositories/BankLinkRepository";
import { Transaction } from "@domain/entities/Transaction";

/**
 * Talks only to Supabase Edge Functions (see /supabase/functions). The
 * Plaid client ID/secret live exclusively in those functions' server-side
 * env — this class, and everything upstream of it, never sees them.
 */
export class SupabasePlaidRepository implements BankLinkRepository {
  async createLinkToken(userId: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke("plaid-create-link-token", {
      body: { userId },
    });
    if (error) throw error;
    return data.linkToken as string;
  }

  async exchangePublicToken(userId: string, publicToken: string): Promise<void> {
    const { error } = await supabase.functions.invoke("plaid-exchange-token", {
      body: { userId, publicToken },
    });
    if (error) throw error;
  }

  async triggerSync(userId: string): Promise<void> {
    const { error } = await supabase.functions.invoke("plaid-sync", {
      body: { userId },
    });
    if (error) throw error;
  }

  async getConnectionStatus(userId: string): Promise<BankConnectionStatus> {
    const { data, error } = await supabase
      .from("plaid_items")
      .select("status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return "unlinked";
    return data.status as BankConnectionStatus;
  }

  async unlink(userId: string): Promise<void> {
    const { error } = await supabase.functions.invoke("plaid-unlink", {
      body: { userId },
    });
    if (error) throw error;
  }

  async getTransactions(userId: string, limit = 25): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from("plaid_transactions")
      .select("id, merchant_name, amount_cents, category, pending, transacted_at")
      .eq("user_id", userId)
      .order("transacted_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id as string,
      merchantName: row.merchant_name as string,
      amountCents: row.amount_cents as number,
      category: (row.category as string | null) ?? undefined,
      pending: row.pending as boolean,
      transactedAt: row.transacted_at as string,
    }));
  }
}
