import { corsHeadersFor } from "../_shared/cors.ts";
import { plaid } from "../_shared/plaid.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userId = await requireUser(req);
    const db = serviceClient();

    const { data: items, error } = await db
      .from("plaid_items")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "linked");
    if (error) throw error;

    for (const item of items ?? []) {
      const { data: secret } = await db
        .from("plaid_item_secrets")
        .select("access_token")
        .eq("plaid_item_id", item.id)
        .maybeSingle();

      if (secret?.access_token) {
        try {
          // Best-effort: an item Plaid already considers stale/errored
          // shouldn't block the user from clearing it out on our end too.
          await plaid.removeItem(secret.access_token);
        } catch {
          // continue — still revoke locally below
        }
      }

      // Delete the secret first (the whole point of unlinking is that this
      // token stops existing anywhere), then mark the item unlinked rather
      // than deleting its row, so synced transaction history referencing
      // it stays intact.
      await db.from("plaid_item_secrets").delete().eq("plaid_item_id", item.id);
      await db.from("plaid_items").update({ status: "unlinked" }).eq("id", item.id);
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
