import { Transaction } from "@domain/entities/Transaction";

export interface RecurringCharge {
  merchant: string;
  /** The most recent charge's amount — subscriptions occasionally step up in
   * price, so "most recent" reads truer than an average across months. */
  amountCents: number;
  /** Distinct calendar months this merchant has charged in. */
  occurrences: number;
  /** YYYY-MM-DD of the most recent charge. */
  lastChargedAt: string;
}

const MIN_OCCURRENCES = 3;
// Subscriptions occasionally step up in price (an annual increase, a plan
// change) — a small band avoids missing a real recurring charge just
// because this year's price differs slightly from last year's.
const AMOUNT_TOLERANCE_RATIO = 0.1;

/**
 * Finds real bank debits that have charged the same merchant for a similar
 * amount across several distinct months — the "forgotten subscription"
 * pattern Checkpoint's philosophy cares about: a quiet, recurring leak the
 * user set up once and then stopped noticing. Deliberately conservative
 * (3+ distinct months, amounts within 10% of each other) so this only ever
 * surfaces charges that are genuinely recurring, not a coincidence of two
 * unrelated purchases from the same merchant.
 */
export function detectRecurringCharges(transactions: Transaction[]): RecurringCharge[] {
  const byMerchant = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.amountCents <= 0) continue; // only real debits, not refunds/deposits
    const key = t.merchantName.trim().toLowerCase();
    const list = byMerchant.get(key) ?? [];
    list.push(t);
    byMerchant.set(key, list);
  }

  const results: RecurringCharge[] = [];
  for (const charges of byMerchant.values()) {
    const months = new Set(charges.map((t) => t.transactedAt.slice(0, 7)));
    if (months.size < MIN_OCCURRENCES) continue;

    const amounts = charges.map((t) => t.amountCents).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    const withinTolerance = amounts.every((a) => Math.abs(a - median) <= median * AMOUNT_TOLERANCE_RATIO);
    if (!withinTolerance) continue;

    const mostRecent = [...charges].sort((a, b) => (a.transactedAt < b.transactedAt ? 1 : -1))[0];
    results.push({
      merchant: mostRecent.merchantName,
      amountCents: mostRecent.amountCents,
      occurrences: months.size,
      lastChargedAt: mostRecent.transactedAt,
    });
  }

  return results.sort((a, b) => b.occurrences - a.occurrences);
}
