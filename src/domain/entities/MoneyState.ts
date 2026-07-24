/**
 * MoneyState is Checkpoint's core domain entity — a snapshot of where the
 * user stands right now. It deliberately avoids "budget" vocabulary; it
 * models state, not rules.
 */
export interface MoneyState {
  /** Cents available to spend without touching anything Protected. */
  availableCents: number;
  /** Cents already set aside for commitments (rent, bills, goals). */
  protectedCents: number;
  /** Cents contributed toward Future You (savings / investing goals). */
  futureYouCents: number;
  /** ISO timestamp this snapshot was computed. */
  asOf: string;
}

export interface SpendingDecisionInput {
  amountCents: number;
  merchant: string;
  category?: string;
}

export type DecisionOutcome = "continued" | "paused" | "reconsidered";

export interface SpendingDecision {
  id: string;
  amountCents: number;
  merchant: string;
  category?: string;
  outcome: DecisionOutcome;
  /** How long the user actually sat on the Checkpoint screen, in ms. */
  pauseDurationMs: number;
  /** Optional "why" behind a paused/reconsidered decision — never asked of
   * a "continued" purchase, since there's nothing to explain. */
  pauseReason?: string;
  decidedAt: string;
}

export function money(cents: number): string {
  // Locale is pinned to en-US rather than left ambient: outside en-US
  // environments (e.g. en-CA), toLocaleString(undefined, ...) renders USD as
  // "US$45.00" instead of "$45.00", which reads as a foreign-currency amount.
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}
