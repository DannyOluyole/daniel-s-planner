// Talks to the background service worker only — popup.js never touches the
// Supabase session directly (see background.js for why).
function sendMessage(message) {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}

const signedOutEl = document.getElementById("signedOut");
const signedInEl = document.getElementById("signedIn");
const signedInAsEl = document.getElementById("signedInAs");
const errorEl = document.getElementById("error");

function showError(message) {
  errorEl.textContent = message;
  errorEl.style.display = "block";
}

async function render() {
  const { session } = await sendMessage({ type: "GET_SESSION" });
  if (session) {
    signedOutEl.style.display = "none";
    signedInEl.style.display = "block";
    signedInAsEl.textContent = `Signed in as ${session.email}`;
  } else {
    signedOutEl.style.display = "block";
    signedInEl.style.display = "none";
  }
}

document.getElementById("signInBtn").addEventListener("click", async () => {
  errorEl.style.display = "none";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) {
    showError("Enter your email and password.");
    return;
  }
  const result = await sendMessage({ type: "SIGN_IN", email, password });
  if (result.error) {
    showError(result.error);
    return;
  }
  await render();
});

document.getElementById("signOutBtn").addEventListener("click", async () => {
  await sendMessage({ type: "SIGN_OUT" });
  await render();
});

render();
