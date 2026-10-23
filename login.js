document.addEventListener("DOMContentLoaded", async () => {
  await cbRenderNav();

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

    btn.disabled = true;
    btn.textContent = "Logging in…";

    try {
      const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
      if (error) {
        btn.disabled = false;
        btn.textContent = "Log In";
        return showError(error.message);
      }
      // Success! Go home.
      location.href = "index.html";
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = "Log In";
      showError("Something went wrong. Try again.");
    }
  });
});
