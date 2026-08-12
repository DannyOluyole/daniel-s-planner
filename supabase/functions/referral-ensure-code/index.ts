import { corsHeadersFor } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";

// Excludes 0/O/1/I/L — the whole point of a short code is someone can read
// it off a screen or hear it out loud without a character that's ambiguous
// either way.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;

function randomCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

// Get-or-create a user's referral code. Code minting has to happen here
// (service role) rather than as a plain client insert — referral_codes has
// no client-facing insert policy, so nobody can register a second code for
// themselves or squat someone else's chosen string.
Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userId = await requireUser(req);
    const db = serviceClient();

    const { data: existing, error: selectError } = await db
      .from("referral_codes")
      .select("code")
      .eq("user_id", userId)
      .maybeSingle();
    if (selectError) throw selectError;
    if (existing) {
      return new Response(JSON.stringify({ code: existing.code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let lastError: unknown = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const code = randomCode();
      const { error: insertError } = await db.from("referral_codes").insert({ user_id: userId, code });
      if (!insertError) {
        return new Response(JSON.stringify({ code }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Unique violation on `code` — collision against another user's code,
      // vanishingly rare at this alphabet size but worth one retry loop
      // rather than failing the request outright.
      lastError = insertError;
    }
    throw lastError instanceof Error ? lastError : new Error("Could not generate a unique referral code.");
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
