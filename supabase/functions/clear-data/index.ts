import { corsHeadersFor } from "../_shared/cors.ts";
import { plaid } from "../_shared/plaid.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";

// "Clear data" in Settings: wipes every row this user owns — decisions,
// goals, commitments, income, watched places, future vision, and any
// linked bank connection — while leaving the auth.users row (and therefore
// the session) untouched. Distinct from delete-account, which removes the
// account itself. money_states has no client-facing delete policy (see
// migration 0001) so this has to run with the service role, same as
// delete-account and plaid-unlink.
Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userId = await requireUser(req);
    const db = serviceClient();

    const { data: items } = await db
      .from("plaid_items")
      .select("id")
      .eq("user_id", userId);

    for (const item of items ?? []) {
      const { data: secret } = await db
        .from("plaid_item_secrets")
        .select("access_token")
        .eq("plaid_item_id", item.id)
        .maybeSingle();
      if (secret?.access_token) {
        try {
          // Best-effort, same as plaid-unlink — a stale/errored item at
          // Plaid's end shouldn't block clearing it out on ours.
          await plaid.removeItem(secret.access_token);
        } catch {
          // continue — the row deletes below regardless
        }
      }
    }

    // plaid_item_secrets and plaid_transactions both cascade from
    // plaid_items (migrations 0014, 0015) — deleting plaid_items is enough.
    const tables = [
      "money_states",
      "spending_decisions",
      "savings_goals",
      "commitments",
      "income",
      "watched_places",
      "future_visions",
      "plaid_items",
    ];
    for (const table of tables) {
      const { error } = await db.from(table).delete().eq("user_id", userId);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
