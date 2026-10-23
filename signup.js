document.addEventListener("DOMContentLoaded", async () => {
  await cbRenderNav();
  if (await cbCurrentUser()) { location.href = "index.html"; return; }

  const form = document.getElementById("signupForm");
  const errEl = document.getElementById("err");
  const btn = document.getElementById("submitBtn");
  const pwInput = document.getElementById("password");
  const strengthBar = document.getElementById("strengthBar");
  const strengthLabel = document.getElementById("strengthLabel");
  const refInput = document.getElementById("refCode");
  const refHint = document.getElementById("refHint");

  pwInput.addEventListener("input", () => {
    const pw = pwInput.value;
    const s = cbPasswordStrength(pw);
    strengthBar.className = "strength-bar " + s.level;
    strengthLabel.className = "strength-label " + s.level;
    strengthLabel.textContent = pw ? s.label : "";
  });

  refInput.addEventListener("input", async () => {
    const code = refInput.value.trim();
    if (!code) { refHint.textContent = ""; return; }
    const referrer = await cbValidateReferralCode(code);
    if (referrer) {
      refHint.textContent = `✓ Valid code — ${referrer.name.split(" ")[0]} will earn $5 too`;
      refHint.style.color = "var(--up)";
    } else {
      refHint.textContent = "Code not found — you can still sign up without it";
      refHint.style.color = "var(--down)";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.classList.remove("show");

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = pwInput.value;
    const confirm = document.getElementById("confirm").value;
    const agreed = document.getElementById("agreeTerms").checked;
    const refCode = refInput.value.trim();

    const showError = (m) => { errEl.textContent = m; errEl.classList.add("show"); };

    if (!name) return showError("Please enter your name.");
    if (!email.includes("@")) return showError("Please enter a valid email.");
    if (password.length < 8) return showError("Password must be at least 8 characters.");
    if (password !== confirm) return showError("Passwords do not match.");
    if (!agreed) return showError("You must agree to the Terms and Privacy Policy.");

    let referrer = null;
    if (refCode) {
      referrer = await cbValidateReferralCode(refCode);
      if (!referrer) return showError("Referral code not found. Clear the field or fix the code.");
    }

    btn.disabled = true;
    btn.textContent = "Creating…";

    try {
      const { data, error } = await window.sb.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });
      if (error) throw error;
      if (!data.user) throw new Error("Signup failed. Try again.");

      if (referrer) {
        await new Promise(r => setTimeout(r, 800));
        await cbApplyReferral(email, referrer.email);
      }

      const redirect = localStorage.getItem("cb_redirect");
      if (redirect) { localStorage.removeItem("cb_redirect"); location.href = redirect; }
      else location.href = "index.html"; // Go to home, not wallet
    } catch (err) {
      console.error(err);
      showError(err.message || "Something went wrong. Try again.");
      btn.disabled = false;
      btn.textContent = "Create Account";
    }
  });
});
