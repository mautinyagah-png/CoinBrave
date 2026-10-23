import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  await cbRenderNav();
  if (await cbCurrentUser()) { location.href = "index.html"; return; }

  const form = document.getElementById("signupForm");
  // ... (Keep your current password strength UI logic)

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // ... (Keep your current validation: name, email, password, confirm, agreeTerms)

    btn.disabled = true; btn.textContent = "Creating…";

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create the user's profile and starting wallet in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        userId: "CB-" + user.uid.slice(0, 6).toUpperCase(),
        createdAt: new Date().toISOString(),
        wallet: { usd: 5000, bitcoin: 0.03, ethereum: 0.5, solana: 5, dogecoin: 5000, cardano: 1000, chainlink: 10 }
      });

      location.href = "index.html";
    } catch (err) {
      console.error(err);
      btn.disabled = false; btn.textContent = "Create Account";
      showError(err.message.replace("Firebase: ", ""));
    }
  });
});
