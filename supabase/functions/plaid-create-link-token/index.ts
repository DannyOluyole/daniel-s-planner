import { corsHeadersFor } from "../_shared/cors.ts";
import { plaid } from "../_shared/plaid.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userId = await requireUser(req);
    const { link_token } = await plaid.createLinkToken(userId);

    return new Response(JSON.stringify({ linkToken: link_token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
