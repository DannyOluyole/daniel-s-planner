// Shared Supabase project config. The anon/publishable key is safe to ship
// client-side by design (same key already embedded in the mobile app) —
// it only grants what each table's row-level security policy allows, and
// every query here runs as the signed-in user via their own access token.
const SUPABASE_URL = "https://bopakscxpdnyakgdqbvu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xsNjD9mRTKxfUp_2MFA8PA_cLbN1TkU";
