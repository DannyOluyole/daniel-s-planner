import { Transaction } from "@domain/entities/Transaction";

export type BankConnectionStatus = "unlinked" | "connecting" | "linked" | "error";

/**
 * Boundary for whatever aggregator links a real bank account (Plaid today).
 * Screens depend on this interface, not on Plaid directly — swapping
 * providers later (e.g. a different aggregator in another region) means
 * writing one new class in data/, not touching any screen.
 *
 * Note the asymmetry with CheckpointRepository: this interface only
 * *establishes* the connection and triggers a sync. Once synced, the
 * resulting numbers are read the normal way, through
 * CheckpointRepository.getMoneyState — this repository never returns
 * MoneyState itself. Aggregator access tokens must never reach the client,
 * so all of this routes through server-side functions.
 */
export interface BankLinkRepository {
  /** Fetches a short-lived token the native Link UI needs to open. */
  createLinkToken(userId: string): Promise<string>;
  /** Exchanges Link's public token for a stored, server-side connection. */
  exchangePublicToken(userId: string, publicToken: string): Promise<void>;
  /** Re-pulls balances for the user's linked accounts into money_states. */
  triggerSync(userId: string): Promise<void>;
  getConnectionStatus(userId: string): Promise<BankConnectionStatus>;
  /** Recent real transactions synced from the linked bank, newest first. */
  getTransactions(userId: string, limit?: number): Promise<Transaction[]>;
}
