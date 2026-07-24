import { corsHeaders } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { syncMoneyStateForUser } from "../_shared/sync.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userId = await requireUser(req);
    const db = serviceClient();
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
