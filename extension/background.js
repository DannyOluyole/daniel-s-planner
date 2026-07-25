// The Supabase session (access + refresh tokens) and every authenticated
// fetch now live only here, in the background service worker — never in a
// content script. Content scripts are injected into 27 third-party
// checkout domains (including lower-trust marketplaces), so this is the
// one place in the extension a compromised or malicious page can't reach:
// content.js only ever sends this worker a plain "what's the impact of a
// $X purchase" message and gets back a result, never the credentials
// themselves. popup.js talks to it the same way for sign-in/out.
importScripts("config.js", "session.js", "impact.js");

function respondAsync(promise, sendResponse) {
  promise
    .then((result) => sendResponse(result))
    .catch((e) => sendResponse({ error: (e && e.message) || "Something went wrong." }));
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SIGN_IN") {
    respondAsync(
      signIn(message.email, message.password).then((session) => ({ session })),
      sendResponse
    );
    return true;
  }

  if (message.type === "SIGN_OUT") {
    respondAsync(signOut().then(() => ({ ok: true })), sendResponse);
    return true;
  }

  if (message.type === "GET_SESSION") {
    respondAsync(getValidSession().then((session) => ({ session })), sendResponse);
    return true;
  }

  if (message.type === "GET_IMPACT") {
    respondAsync(
      getValidSession().then(async (session) => {
        if (!session) return { signedOut: true };
        const impact = await getPersonalizedImpact(session, message.orderAmountCents);
        return { impact };
      }),
      sendResponse
    );
    return true;
  }

  return false;
});
