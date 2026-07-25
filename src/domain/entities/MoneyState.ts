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

/**
 * The user's own stated reason for a purchase, captured before the amount
 * (see NewDecisionScreen) — distinct from `Intent` in parsePurchaseSpeech.ts,
 * which groups categories (Investing in myself / Lifestyle /
 * Responsibilities) rather than recording what the user actually said.
 */
export type PurchaseIntent = "Need" | "Want" | "Gift" | "Work" | "Replacement" | "Celebration";

export const PURCHASE_INTENTS: PurchaseIntent[] = [
  "Need",
  "Want",
  "Gift",
  "Work",
  "Replacement",
  "Celebration",
];

export interface SpendingDecisionInput {
  amountCents: number;
  merchant: string;
  category?: string;
  intent?: PurchaseIntent;
}

export type DecisionOutcome = "continued" | "paused" | "reconsidered";

export interface SpendingDecision {
  id: string;
  amountCents: number;
  merchant: string;
  category?: string;
  intent?: PurchaseIntent;
  outcome: DecisionOutcome;
  /** How long the user actually sat on the Checkpoint screen, in ms. */
  pauseDurationMs: number;
  /** Optional "why" behind a paused/reconsidered decision — never asked of
   * a "continued" purchase, since there's nothing to explain. */
  pauseReason?: string;
  /** Set after the fact (never at the time of the decision) when the user
   * marks a past "continued" purchase as one they regretted — "Decision
   * Memory" gently surfaces this the next time a similar purchase comes up. */
  regretted?: boolean;
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
