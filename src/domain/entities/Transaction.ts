/**
 * A single real transaction pulled from the user's linked bank via Plaid.
 * Read-only from the app's perspective — Checkpoint never writes these,
 * only displays them as recent activity.
 */
export interface Transaction {
  id: string;
  merchantName: string;
  /** Positive = money out (a purchase), negative = money in (a refund or
   * deposit) — same sign convention Plaid itself uses. */
  amountCents: number;
  category?: string;
  pending: boolean;
  /** YYYY-MM-DD */
  transactedAt: string;
}
