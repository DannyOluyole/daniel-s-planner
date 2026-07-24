import { plaid, PlaidAccount, PlaidTransaction } from "./plaid.ts";

/**
 * Heuristic mapping from raw account balances to Checkpoint's three
 * numbers. This is a starting point, not a finished model — refine once
 * real commitments/goals data exists:
 *
 *  - Available   -> sum of depository (checking) available balances
 *  - Protected   -> sum of depository (savings) current balances
 *                   (treated as already "spoken for" until goals exist)
 *  - Future You  -> sum of investment account current balances
 */
function computeMoneyState(accounts: PlaidAccount[]) {
  let availableCents = 0;
  let protectedCents = 0;
  let futureYouCents = 0;

  for (const account of accounts) {
    const available = account.balances.available ?? account.balances.current ?? 0;
    const current = account.balances.current ?? 0;
    const cents = Math.round(available * 100);
    const currentCents = Math.round(current * 100);

    if (account.type === "depository" && account.subtype === "checking") {
      availableCents += cents;
    } else if (account.type === "depository" && account.subtype === "savings") {
      protectedCents += currentCents;
    } else if (account.type === "investment") {
      futureYouCents += currentCents;
    }
  }

  return { availableCents, protectedCents, futureYouCents };
}

function mapTransaction(t: PlaidTransaction, userId: string, plaidItemId: string) {
  return {
    user_id: userId,
    plaid_item_id: plaidItemId,
    transaction_id: t.transaction_id,
    account_id: t.account_id,
    // Plaid convention: positive amount = money out, negative = money in.
    amount_cents: Math.round(t.amount * 100),
    merchant_name: t.merchant_name ?? t.name,
    category: t.personal_finance_category?.primary ?? t.category?.[0] ?? null,
    pending: t.pending,
    transacted_at: t.date,
  };
}

// deno-lint-ignore no-explicit-any
async function syncTransactionsForItem(db: any, userId: string, item: { id: string; access_token: string; cursor: string | null }) {
  let cursor = item.cursor;
  let hasMore = true;
  const upserts: ReturnType<typeof mapTransaction>[] = [];
  const removedIds: string[] = [];

  while (hasMore) {
    const page = await plaid.syncTransactions(item.access_token, cursor);
    for (const t of [...page.added, ...page.modified]) {
      upserts.push(mapTransaction(t, userId, item.id));
    }
    for (const r of page.removed) {
      removedIds.push(r.transaction_id);
    }
    cursor = page.next_cursor;
    hasMore = page.has_more;
  }

  if (upserts.length > 0) {
    const { error } = await db.from("plaid_transactions").upsert(upserts, { onConflict: "transaction_id" });
    if (error) throw error;
  }
  if (removedIds.length > 0) {
    const { error } = await db.from("plaid_transactions").delete().in("transaction_id", removedIds);
    if (error) throw error;
  }

  const { error: cursorError } = await db.from("plaid_items").update({ cursor }).eq("id", item.id);
  if (cursorError) throw cursorError;
}

// deno-lint-ignore no-explicit-any
export async function syncMoneyStateForUser(db: any, userId: string) {
  const { data: items, error } = await db
    .from("plaid_items")
    .select("id, access_token, cursor")
    .eq("user_id", userId)
    .eq("status", "linked");

  if (error) throw error;
  if (!items || items.length === 0) return;

  let availableCents = 0;
  let protectedCents = 0;
  let futureYouCents = 0;

  for (const item of items) {
    const { accounts } = await plaid.getBalances(item.access_token);
    const totals = computeMoneyState(accounts);
    availableCents += totals.availableCents;
    protectedCents += totals.protectedCents;
    futureYouCents += totals.futureYouCents;

    await syncTransactionsForItem(db, userId, item);
  }

  const { error: upsertError } = await db.from("money_states").insert({
    user_id: userId,
    available_cents: availableCents,
    protected_cents: protectedCents,
    future_you_cents: futureYouCents,
    as_of: new Date().toISOString(),
  });
  if (upsertError) throw upsertError;
}
