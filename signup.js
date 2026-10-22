document.addEventListener("DOMContentLoaded", () => {
  cbRenderNav();
  if (cbCurrentUser()) { location.href = "wallet.html"; return; }

  const form  = document.getElementById("signupForm");
  const errEl = document.getElementById("err");
  const btn   = document.getElementById("submitBtn");

  function showError(msg) { errEl.textContent = msg; errEl.classList.add("show"); }
  function clearError() { errEl.classList.remove("show"); errEl.textContent = ""; }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const name     = document.getElementById("name").value.trim();
    const email    = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirm  = document.getElementById("confirm").value;

    if (!name) return showError("Please enter your name.");
    if (!email.includes("@")) return showError("Please enter a valid email.");
    if (password.length < 8) return showError("Password must be at least 8 characters.");
    if (password !== confirm) return showError("Passwords do not match.");

    const users = cbGetUsers();
    if (users.some(u => u.email === email)) return showError("An account with this email already exists. Try logging in.");

    btn.disabled = true;
    btn.textContent = "Creating…";

    try {
      const passwordHash = await cbHashPassword(password);
      users.push({ name, email, passwordHash, createdAt: new Date().toISOString() });
      cbSaveUsers(users);
      cbSaveWallet(email, cbDefaultWallet());
      cbSetSession(email);

      const redirect = localStorage.getItem("cb_redirect");
      if (redirect) { localStorage.removeItem("cb_redirect"); location.href = redirect; }
      else location.href = "wallet.html";
    } catch (err) {
      console.error(err);
      showError("Something went wrong. Please try again.");
      btn.disabled = false;
      btn.textContent = "Create Account";
    }
  });
});
