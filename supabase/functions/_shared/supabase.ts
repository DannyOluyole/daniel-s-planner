import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Service-role client — bypasses RLS. Only ever used inside edge functions,
 * never shipped to the app. Used to read/write plaid_items (which holds
 * access tokens) and to write money_states on the user's behalf.
 */
export function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

/**
 * Verifies the caller's JWT (from the Authorization header Supabase client
 * libraries attach automatically) and returns their user id. Every function
 * below calls this first — never trust a userId passed in the body alone.
 */
export async function requireUser(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const { data, error } = await anonClient.auth.getUser(jwt);
  if (error || !data.user) {
    throw new Error("Unauthorized");
  }
  return data.user.id;
}
