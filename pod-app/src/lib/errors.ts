/**
 * Supabase's own AuthError/PostgrestError messages (returned as `{ error }`
 * on a resolved call) are already user-presentable. This is for the OTHER
 * case: the call throws outright (e.g. `TypeError: Failed to fetch` when
 * there's no network route to Supabase at all -- during an outage, airplane
 * mode, a dead wifi handoff, etc.) instead of resolving with an error field.
 * Every Supabase call site should catch and route through this so a network
 * blip shows a friendly retry message instead of an uncaught exception.
 */
const NETWORK_FAILURE_PATTERN = /failed to fetch|network request failed|network error/i;

export function friendlyErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : typeof err === "string" ? err : null;
  if (message && NETWORK_FAILURE_PATTERN.test(message)) {
    return "Can't reach Pod right now — check your connection and try again.";
  }
  if (message) return message;
  return "Something went wrong. Try again.";
}
