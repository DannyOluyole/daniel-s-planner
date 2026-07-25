// Checkpoint — the pause, brought to online checkouts (Stage 3).
// Shows one quiet overlay per checkout visit. Never blocks, never touches
// the page's forms — it's a moment, not a wall. The overlay appears
// immediately with a generic prompt, then upgrades in place to a real
// dollar-impact message once the signed-in user's data comes back — never
// making the pause itself wait on a network round trip.

const OVERLAY_ID = "checkpoint-decision-overlay";
const DISMISSED_KEY = "checkpoint-dismissed";
// Where "Open Decision Mode" goes. checkpoint://decision reaches the
// installed mobile/desktop app; swap for the hosted web app URL when one
// exists.
const DECISION_URL = "checkpoint://decision";

function alreadyDismissedHere() {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === location.pathname;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    sessionStorage.setItem(DISMISSED_KEY, location.pathname);
  } catch {
    // Session storage unavailable (rare) — showing again later is the
    // acceptable failure mode, silently never showing is not.
  }
}

function buildOverlay() {
  const wrap = document.createElement("div");
  wrap.id = OVERLAY_ID;
  wrap.style.cssText = [
    "position:fixed",
    "right:20px",
    "bottom:20px",
    "z-index:2147483647",
    "width:300px",
    "background:#14181f",
    "border:1px solid #2C323D",
    "border-radius:16px",
    "padding:16px",
    "font-family:system-ui,-apple-system,sans-serif",
    "box-shadow:0 8px 30px rgba(0,0,0,0.45)",
  ].join(";");

  const stripe = document.createElement("div");
  stripe.style.cssText =
    "height:6px;border-radius:3px;margin-bottom:12px;" +
    "background:repeating-linear-gradient(45deg,#E8A33D 0 10px,#14181f 10px 20px)";
  wrap.appendChild(stripe);

  const title = document.createElement("div");
  title.textContent = "Checkpoint";
  title.style.cssText = "color:#9A9CA5;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;";
  wrap.appendChild(title);

  const question = document.createElement("div");
  question.id = "checkpoint-headline";
  question.textContent = "Before you place this order — is it worth it, right now?";
  question.style.cssText = "color:#F5F5F7;font-size:14px;font-weight:600;margin-top:6px;line-height:1.4;";
  wrap.appendChild(question);

  const score = document.createElement("div");
  score.id = "checkpoint-score";
  score.style.cssText = "display:none;margin-top:10px;align-items:baseline;gap:6px;";
  wrap.appendChild(score);

  const hint = document.createElement("div");
  hint.id = "checkpoint-signin-hint";
  hint.textContent = "Sign in via the Checkpoint icon in your toolbar for a real dollar-impact check.";
  hint.style.cssText = "display:none;color:#6B7280;font-size:11px;margin-top:8px;line-height:1.4;";
  wrap.appendChild(hint);

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;gap:8px;margin-top:14px;";

  const open = document.createElement("button");
  open.textContent = "Open Decision Mode";
  open.style.cssText =
    "flex:1;background:#2F5D50;color:#fff;border:none;border-radius:10px;padding:9px 10px;" +
    "font-size:12px;font-weight:600;cursor:pointer;";
  open.addEventListener("click", () => {
    window.location.href = DECISION_URL;
  });
  actions.appendChild(open);

  const dismiss = document.createElement("button");
  dismiss.textContent = "I'll pause";
  dismiss.style.cssText =
    "background:transparent;color:#9A9CA5;border:1px solid #2C323D;border-radius:10px;" +
    "padding:9px 10px;font-size:12px;cursor:pointer;";
  dismiss.addEventListener("click", () => {
    markDismissed();
    wrap.remove();
  });
  actions.appendChild(dismiss);

  wrap.appendChild(actions);
  return wrap;
}

function applyPersonalizedImpact(impact) {
  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return; // dismissed before this resolved

  const headlineEl = overlay.querySelector("#checkpoint-headline");
  if (headlineEl) headlineEl.textContent = impact.headline;

  const scoreEl = overlay.querySelector("#checkpoint-score");
  if (scoreEl) {
    scoreEl.style.display = "flex";
    const tone = impact.score >= 60 ? "#3E9C7C" : "#E0A458";
    scoreEl.innerHTML = "";

    const pct = document.createElement("span");
    pct.textContent = `${impact.score}%`;
    pct.style.cssText = `color:${tone};font-size:20px;font-weight:800;`;
    scoreEl.appendChild(pct);

    const label = document.createElement("span");
    label.textContent = impact.scoreLabel;
    label.style.cssText = "color:#9A9CA5;font-size:12px;font-weight:500;";
    scoreEl.appendChild(label);
  }
}

function showSignInHint() {
  const overlay = document.getElementById(OVERLAY_ID);
  const hintEl = overlay && overlay.querySelector("#checkpoint-signin-hint");
  if (hintEl) hintEl.style.display = "block";
}

// The session and every authenticated fetch live only in the background
// service worker (see background.js) — this content script, injected into
// third-party checkout pages, only ever sends a plain "what's the impact of
// a $X purchase" message and gets back a result, never the credentials
// themselves.
function tryPersonalize() {
  try {
    const orderAmountCents = findOrderTotalCents();
    if (orderAmountCents == null) return; // couldn't confidently read a total — stays generic

    chrome.runtime.sendMessage({ type: "GET_IMPACT", orderAmountCents }, (response) => {
      if (chrome.runtime.lastError || !response) return;
      if (response.signedOut) {
        showSignInHint();
        return;
      }
      if (response.impact) applyPersonalizedImpact(response.impact);
    });
  } catch {
    // Any failure here (unexpected page structure, extension context gone)
    // just leaves the generic prompt in place.
  }
}

function maybeShow() {
  if (document.getElementById(OVERLAY_ID)) return;
  if (alreadyDismissedHere()) return;
  if (!isCheckoutUrl(location.href)) return;
  document.body.appendChild(buildOverlay());
  tryPersonalize();
}

maybeShow();

// SPA checkouts (Amazon especially) change URL without a page load — watch
// for that instead of only checking once at injection.
let lastHref = location.href;
new MutationObserver(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    maybeShow();
  }
}).observe(document.body, { childList: true, subtree: true });
