import { corsHeadersFor } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";

const PREMIUM_DAYS_PER_REFERRAL = 30;

// Always resolves with HTTP 200 and a { ok, ... } body, even for expected
// failures (bad code, self-referral, already used) — the JS client's
// FunctionsHttpError doesn't reliably surface a structured body on non-2xx
// responses across SDK versions, so distinct, user-facing reasons only stay
// distinguishable if they ride back on a 200. Only genuinely unexpected
// failures (auth, DB errors) use a non-200 status.
Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
  const ok = (body: Record<string, unknown>) => new Response(JSON.stringify(body), { headers: jsonHeaders });

  try {
    const referredId = await requireUser(req);
    const { code } = await req.json();
    if (typeof code !== "string" || code.trim().length === 0) {
      return ok({ ok: false, error: "invalid_code" });
    }
    const normalizedCode = code.trim().toUpperCase();

    const db = serviceClient();

    const { data: codeRow, error: codeError } = await db
      .from("referral_codes")
      .select("user_id")
      .eq("code", normalizedCode)
      .maybeSingle();
    if (codeError) throw codeError;
    if (!codeRow) {
      return ok({ ok: false, error: "invalid_code" });
    }

    const referrerId = codeRow.user_id as string;
    if (referrerId === referredId) {
      return ok({ ok: false, error: "self_referral" });
    }

    const { data: existingReferral, error: existingError } = await db
      .from("referrals")
      .select("id")
      .eq("referred_id", referredId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingReferral) {
      return ok({ ok: false, error: "already_used" });
    }

    const { data: referral, error: insertError } = await db
      .from("referrals")
      .insert({
        referrer_id: referrerId,
        referred_id: referredId,
        code: normalizedCode,
        activated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (insertError) {
      // Unique violation on referred_id — a race against another concurrent
      // redemption attempt landed first. Same user-facing outcome either way.
      if (insertError.code === "23505") {
        return ok({ ok: false, error: "already_used" });
      }
      throw insertError;
    }

    const { error: rewardsError } = await db.from("referral_rewards").insert([
      { user_id: referrerId, referral_id: referral.id, premium_days: PREMIUM_DAYS_PER_REFERRAL },
      { user_id: referredId, referral_id: referral.id, premium_days: PREMIUM_DAYS_PER_REFERRAL },
    ]);
    if (rewardsError) throw rewardsError;

    return ok({ ok: true, premiumDaysEarned: PREMIUM_DAYS_PER_REFERRAL });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: jsonHeaders,
    });
  }
});
