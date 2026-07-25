import { corsHeadersFor } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { syncMoneyStateForUser } from "../_shared/sync.ts";

// Unlike plaid-exchange-token (naturally bounded by needing a fresh,
// interactive Plaid Link session each time), this function has no friction
// at all — just a userId. Without a cooldown, a compromised/scripted client
// could hammer it, running up unnecessary Plaid API calls per sync. Reusing
// money_states.as_of (already written at the end of every real sync) avoids
// needing a dedicated tracking table for this.
const MIN_SYNC_INTERVAL_MS = 60_000;

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userId = await requireUser(req);
    const db = serviceClient();

    const { data: lastState } = await db
      .from("money_states")
      .select("as_of")
      .eq("user_id", userId)
      .order("as_of", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastState && Date.now() - new Date(lastState.as_of).getTime() < MIN_SYNC_INTERVAL_MS) {
      return new Response(JSON.stringify({ error: "Synced very recently — try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
