document.addEventListener("DOMContentLoaded", async () => {
  await cbRenderNav();
  if (await cbCurrentUser()) { location.href = "wallet.html"; return; }

  const form = document.getElementById("loginForm");
  const errEl = document.getElementById("err");
  const btn = document.getElementById("submitBtn");
  const showError = (m) => { errEl.textContent = m; errEl.classList.add("show"); };
  const clearError = () => errEl.classList.remove("show");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    const lockRemaining = cbIsLockedOut(email);
    if (lockRemaining > 0) return showError(`Too many failed attempts. Try again in ${lockRemaining}s.`);

    btn.disabled = true;
    btn.textContent = "Logging in…";

    try {
      const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
      if (error) {
        cbRecordFailedAttempt(email);
        btn.disabled = false;
        btn.textContent = "Log In";
        return showError(error.message);
      }
      cbResetLoginAttempts(email);
      cbInvalidateUserCache();
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
