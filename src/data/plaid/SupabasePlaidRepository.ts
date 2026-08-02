import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@core/config/supabase";
import {
  BankConnectionStatus,
  BankLinkRepository,
} from "@domain/repositories/BankLinkRepository";
import { Transaction } from "@domain/entities/Transaction";

/**
 * Every plaid-* edge function returns `{ error: message }` in the response
 * body on failure, but supabase-js's FunctionsHttpError always hardcodes
 * its own `.message` to the generic "Edge Function returned a non-2xx
 * status code" — the actual reason (e.g. a Plaid API error) only exists in
 * `.context`, the raw Response, and has to be read out manually. Without
 * this, that generic string is exactly what ends up in front of the user.
 */
async function unwrapFunctionsError(error: unknown): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === "string") return new Error(body.error);
    } catch {
      // Response body wasn't JSON or already consumed — fall through to the generic error below.
    }
  }
  return error as Error;
}

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
    if (error) throw await unwrapFunctionsError(error);
    return data.linkToken as string;
  }

  async exchangePublicToken(userId: string, publicToken: string): Promise<void> {
    const { error } = await supabase.functions.invoke("plaid-exchange-token", {
      body: { userId, publicToken },
    });
    if (error) throw await unwrapFunctionsError(error);
  }

  async triggerSync(userId: string): Promise<void> {
    const { error } = await supabase.functions.invoke("plaid-sync", {
      body: { userId },
    });
    if (error) throw await unwrapFunctionsError(error);
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
    if (error) throw await unwrapFunctionsError(error);
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
