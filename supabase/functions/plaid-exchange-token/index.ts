import { corsHeaders } from "../_shared/cors.ts";
import { plaid } from "../_shared/plaid.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { syncMoneyStateForUser } from "../_shared/sync.ts";

interface Body {
  publicToken: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userId = await requireUser(req);
    const { publicToken } = (await req.json()) as Body;
    if (!publicToken) throw new Error("publicToken is required");

    const { access_token, item_id } = await plaid.exchangePublicToken(publicToken);

    const db = serviceClient();
    const { error } = await db.from("plaid_items").insert({
      user_id: userId,
      item_id,
      // Access tokens never leave this service-role context; RLS on
      // plaid_items (see README schema) blocks normal users from
      // selecting this column at all.
      access_token,
      status: "linked",
    });
    if (error) throw error;

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
