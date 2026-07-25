import { corsHeadersFor } from "../_shared/cors.ts";
import { plaid } from "../_shared/plaid.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { syncMoneyStateForUser } from "../_shared/sync.ts";

interface Body {
  publicToken: string;
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userId = await requireUser(req);
    const { publicToken } = (await req.json()) as Body;
    if (!publicToken) throw new Error("publicToken is required");

    const { access_token, item_id } = await plaid.exchangePublicToken(publicToken);

    const db = serviceClient();
    const { data: inserted, error } = await db
      .from("plaid_items")
      .insert({ user_id: userId, item_id, status: "linked" })
      .select("id")
      .single();
    if (error) throw error;

    // access_token lives in its own table, with no grants at all to
    // anon/authenticated — only this service-role context ever reads it
    // (see migration 0014).
    const { error: secretError } = await db
      .from("plaid_item_secrets")
      .insert({ plaid_item_id: inserted.id, access_token });
    if (secretError) throw secretError;

    // Populate money_states immediately so the app has real numbers as
    // soon as Link closes, rather than waiting on the next scheduled sync.
    await syncMoneyStateForUser(db, userId);

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
