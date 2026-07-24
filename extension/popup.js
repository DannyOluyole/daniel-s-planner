const signedOutEl = document.getElementById("signedOut");
const signedInEl = document.getElementById("signedIn");
const signedInAsEl = document.getElementById("signedInAs");
const errorEl = document.getElementById("error");

function showError(message) {
  errorEl.textContent = message;
  errorEl.style.display = "block";
}

async function render() {
  const session = await getStoredSession();
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
  try {
    await signIn(email, password);
    await render();
  } catch (e) {
    showError(e.message || "Sign-in failed.");
  }
});

document.getElementById("signOutBtn").addEventListener("click", async () => {
  await signOut();
  await render();
});

render();
