import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- CONSTANTS & FORMATTERS ---
const CB_THEME_KEY = "cb_theme";
const CB_EMOJIS = ["🦁","🐂","🐻","🦊","🐺","🐯","🦄","🐳","🦈","🐬","🦅","🐉","🚀","💎","🌙","⭐","🔥","🎯","🎨","🧠"];

function cbFormatPrice(p) { if (p == null || isNaN(p)) return "—"; if (p >= 1) return "$" + p.toLocaleString(undefined, { maximumFractionDigits: 2 }); if (p >= 0.01) return "$" + p.toFixed(4); return "$" + p.toFixed(6); }
function cbFormatSigned(n, decimals) { const d = decimals == null ? 2 : decimals; const sign = n >= 0 ? "+" : "-"; return sign + "$" + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }); }
function cbSparkline(prices, width, height, up) { /* ... same as before ... */ }
function cbPasswordStrength(pw) { /* ... same as before ... */ }

// --- AUTH & USER DATA ---
let currentUserCache = null;

async function cbCurrentUser() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) { currentUserCache = null; resolve(null); return; }
      
      // Get profile from Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      let profile = docSnap.exists() ? docSnap.data() : { name: user.email.split('@')[0], userId: "CB-" + user.uid.slice(0, 6).toUpperCase() };
      
      currentUserCache = {
        id: user.uid,
        email: user.email,
        ...profile
      };
      resolve(currentUserCache);
    });
  });
}

async function cbSaveUserProfile(data) {
  const user = await cbCurrentUser();
  if (!user) return;
  await setDoc(doc(db, "users", user.id), data, { merge: true });
  currentUserCache = { ...currentUserCache, ...data };
}

async function cbClearSession() {
  await signOut(auth);
}

// --- WALLET & DATA (Firestore) ---
async function cbGetWallet() {
  const user = await cbCurrentUser();
  if (!user) return null;
  const docRef = doc(db, "users", user.id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data().wallet || { usd: 5000 }) : { usd: 5000 };
}

async function cbSaveWallet(wallet) {
  const user = await cbCurrentUser();
  if (!user) return;
  await setDoc(doc(db, "users", user.id), { wallet }, { merge: true });
}

// ... (Keep remaining helper functions like cbGetFavorites, cbToggleFavorite, cbRenderNav, cbRenderFooter, cbRenderProfileDrawer, etc. 
// For brevity, assume they are the same as your current auth.js, but replace localStorage wallet calls with the Firestore ones above.)
