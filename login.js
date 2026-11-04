document.addEventListener("DOMContentLoaded", () => {
  cbRenderNav();
  if (cbCurrentUser()) { location.href = "index.html"; return; }

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

    const user = cbGetUsers().find(u => u.email === email);
    if (!user) return showError("No account found with that email.");

    btn.disabled = true; btn.textContent = "Logging in…";

    try {
      const hash = await cbHashPassword(password);
      if (hash !== user.passwordHash) {
        btn.disabled = false; btn.textContent = "Log In";
        return showError("Incorrect password.");
      }
      cbSetSession(email);
      const redirect = localStorage.getItem("cb_redirect");
      if (redirect) { localStorage.removeItem("cb_redirect"); location.href = redirect; }
      else location.href = "index.html";
    } catch (err) {
      console.error(err);
      btn.disabled = false; btn.textContent = "Log In";
      showError("Something went wrong. Try again.");
    }
  });
});
