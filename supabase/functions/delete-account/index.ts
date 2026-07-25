import { corsHeadersFor } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";

// Deletes the caller's own Supabase auth user via the admin API (service
// role only — the client-side SDK has no way to do this itself). Every
// table referencing auth.users cascades (see migration 0015), so this one
// call is enough to remove the account and everything tied to it.
Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userId = await requireUser(req);
    const db = serviceClient();
    const { error } = await db.auth.admin.deleteUser(userId);
    if (error) throw error;

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
