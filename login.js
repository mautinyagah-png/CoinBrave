document.addEventListener("DOMContentLoaded", async () => {
  // CLEAR THE LOCKOUT AUTOMATICALLY when landing on the login page
  localStorage.removeItem("cb_login_attempts"); 
  
  await cbRenderNav();

  const form = document.getElementById("loginForm");
  const errEl = document.getElementById("err");
  const btn = document.getElementById("submitBtn");
  
  // If already logged in, show a "Go Home" button instead of looping
  const user = await cbCurrentUser();
  if (user) {
    document.querySelector(".auth-card").innerHTML = `
      <h1>You're already logged in</h1>
      <p class="sub">Welcome back, ${user.name.split(" ")[0]}!</p>
      <a href="index.html" class="btn-primary" style="text-align:center;display:block;text-decoration:none">Go to Home</a>
    `;
    return;
  }

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
      cbInvalidateUserCache();
      const redirect = localStorage.getItem("cb_redirect");
      if (redirect) { localStorage.removeItem("cb_redirect"); location.href = redirect; }
      else location.href = "index.html";
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = "Log In";
      showError("Something went wrong. Try again.");
    }
  });
});
