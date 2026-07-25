import { BankConnectionStatus, BankLinkRepository } from "@domain/repositories/BankLinkRepository";
import { Transaction } from "@domain/entities/Transaction";

/**
 * Stand-in for BankLinkRepository in local/demo mode. Bank linking needs a
 * real Supabase project + Plaid credentials, so this reports "unlinked" and
 * refuses to start a connection with a clear message instead of crashing.
 */
export class LocalBankLinkRepository implements BankLinkRepository {
  async createLinkToken(): Promise<string> {
    throw new Error("Connect a Supabase project to link a real bank account.");
  }

  async exchangePublicToken(): Promise<void> {
    throw new Error("Connect a Supabase project to link a real bank account.");
  }

  async triggerSync(): Promise<void> {
    // No-op in demo mode — there's nothing to sync without a real connection.
  }

  async getConnectionStatus(): Promise<BankConnectionStatus> {
    return "unlinked";
  }

  async getTransactions(): Promise<Transaction[]> {
    return [];
  }

  async unlink(): Promise<void> {
    // No-op in demo mode — there's nothing linked to revoke.
  }
}
