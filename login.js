document.addEventListener("DOMContentLoaded", () => {
  cbRenderNav();
  if (cbCurrentUser()) { location.href = "wallet.html"; return; }

  const form  = document.getElementById("loginForm");
  const errEl = document.getElementById("err");
  const btn   = document.getElementById("submitBtn");

  function showError(msg) { errEl.textContent = msg; errEl.classList.add("show"); }
  function clearError() { errEl.classList.remove("show"); errEl.textContent = ""; }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const email    = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    // Rate limit check
    const lockRemaining = cbIsLockedOut(email);
    if (lockRemaining > 0) {
      return showError(`Too many failed attempts. Try again in ${lockRemaining}s.`);
    }

    const user = cbGetUsers().find(u => u.email === email);
    if (!user) {
      const count = cbRecordFailedAttempt(email);
      if (count >= 3) return showError("Too many failed attempts. Wait 30 seconds before trying again.");
      return showError("No account found with that email.");
    }

    btn.disabled = true;
    btn.textContent = "Logging in…";

    try {
      const hash = await cbHashPassword(password);
      if (hash !== user.passwordHash) {
        const count = cbRecordFailedAttempt(email);
        btn.disabled = false;
        btn.textContent = "Log In";
        if (count >= 3) return showError("Too many failed attempts. Wait 30 seconds before trying again.");
        return showError(`Incorrect password. ${3 - count} attempt${3 - count === 1 ? "" : "s"} remaining.`);
      }
      cbResetLoginAttempts(email);
      cbSetSession(email);
      const redirect = localStorage.getItem("cb_redirect");
      if (redirect) { localStorage.removeItem("cb_redirect"); location.href = redirect; }
      else location.href = "wallet.html";
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = "Log In";
      showError("Something went wrong. Try again.");
    }
  });
});
