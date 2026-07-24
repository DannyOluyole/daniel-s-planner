// Talks to Supabase Auth's REST API directly — this extension has no
// bundler, so the full @supabase/supabase-js SDK isn't practical to ship;
// a handful of plain fetch calls covers everything needed (sign in, sign
// out, refresh).

const SESSION_STORAGE_KEY = "checkpoint_session";

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.msg || "Sign-in failed.");
  }
  const session = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    userId: data.user?.id,
    email: data.user?.email,
  };
  await chrome.storage.local.set({ [SESSION_STORAGE_KEY]: session });
  return session;
}

async function signOut() {
  await chrome.storage.local.remove(SESSION_STORAGE_KEY);
}

async function getStoredSession() {
  const result = await chrome.storage.local.get(SESSION_STORAGE_KEY);
  return result[SESSION_STORAGE_KEY] ?? null;
}

async function refreshSession(session) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  const data = await res.json();
  if (!res.ok) return null;
  const next = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    userId: data.user?.id ?? session.userId,
    email: data.user?.email ?? session.email,
  };
  await chrome.storage.local.set({ [SESSION_STORAGE_KEY]: next });
  return next;
}

/**
 * Returns a session with a valid (non-expired) access token, refreshing it
 * first if needed, or null if the user was never signed in / the refresh
 * token itself has expired (Supabase refresh tokens are long-lived but not
 * infinite — at that point the user needs to sign in again).
 */
async function getValidSession() {
  const session = await getStoredSession();
  if (!session) return null;
  // Refresh a little before actual expiry to avoid a request landing right
  // on the boundary.
  if (Date.now() < session.expiresAt - 60000) return session;
  return refreshSession(session);
}

if (typeof module !== "undefined") {
  module.exports = { signIn, signOut, getStoredSession, refreshSession, getValidSession };
}
