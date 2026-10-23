import { auth } from './firebase.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  await cbRenderNav();
  if (await cbCurrentUser()) { location.href = "index.html"; return; }

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

    btn.disabled = true; btn.textContent = "Logging in…";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      location.href = "index.html";
    } catch (err) {
      console.error(err);
      btn.disabled = false; btn.textContent = "Log In";
      showError(err.message.replace("Firebase: ", ""));
    }
  });
});
