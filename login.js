document.addEventListener("DOMContentLoaded", () => {
  cbRenderNav();

  if (cbCurrentUser()) {
    location.href = "wallet.html";
    return;
  }

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

    const user = cbGetUsers().find(u => u.email === email);
    if (!user) return showError("No account found with that email.");

    btn.disabled = true;
    btn.textContent = "Logging in…";

    try {
      const hash = await cbHashPassword(password);
      if (hash !== user.passwordHash) {
        btn.disabled = false;
        btn.textContent = "Log In";
        return showError("Incorrect password.");
      }
      cbSetSession(email);
      location.href = "wallet.html";
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = "Log In";
      showError("Something went wrong. Try again.");
    }
  });
});
