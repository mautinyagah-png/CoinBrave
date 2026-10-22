// CoinBrave shared helpers
const CB_USERS_KEY     = "cb_users";
const CB_SESSION_KEY   = "cb_session";
const CB_WALLET_PREFIX = "cb_wallet_";
const CB_FAV_KEY       = "cb_favorites";
const CB_REDIRECT_KEY  = "cb_redirect";

function cbGetUsers() {
  try { return JSON.parse(localStorage.getItem(CB_USERS_KEY) || "[]"); }
  catch { return []; }
}
function cbSaveUsers(users) {
  localStorage.setItem(CB_USERS_KEY, JSON.stringify(users));
}
function cbGetSession() { return localStorage.getItem(CB_SESSION_KEY); }
function cbSetSession(email) { localStorage.setItem(CB_SESSION_KEY, email); }
function cbClearSession() { localStorage.removeItem(CB_SESSION_KEY); }
function cbCurrentUser() {
  const email = cbGetSession();
  if (!email) return null;
  return cbGetUsers().find(u => u.email === email) || null;
}
function cbGetWallet(email) {
  try { return JSON.parse(localStorage.getItem(CB_WALLET_PREFIX + email) || "null"); }
  catch { return null; }
}
function cbSaveWallet(email, wallet) {
  localStorage.setItem(CB_WALLET_PREFIX + email, JSON.stringify(wallet));
}
async function cbHashPassword(password) {
  const enc = new TextEncoder().encode(password + "::coinbrave::salt");
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

// Favorites
function cbGetFavorites() {
  try { return JSON.parse(localStorage.getItem(CB_FAV_KEY) || "[]"); }
  catch { return []; }
}
function cbSaveFavorites(list) {
  localStorage.setItem(CB_FAV_KEY, JSON.stringify(list));
}
function cbToggleFavorite(coinId) {
  const favs = cbGetFavorites();
  const idx = favs.indexOf(coinId);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(coinId);
  cbSaveFavorites(favs);
  return favs.includes(coinId);
}

// Price formatter
function cbFormatPrice(p) {
  if (p == null || isNaN(p)) return "—";
  if (p >= 1) return "$" + p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (p >= 0.01) return "$" + p.toFixed(4);
  return "$" + p.toFixed(6);
}

function cbRequireAuth() {
  if (!cbCurrentUser()) {
    localStorage.setItem(CB_REDIRECT_KEY, location.href);
    location.href = "login.html";
    return false;
  }
  return true;
}

function cbRenderNav() {
  const user = cbCurrentUser();
  const path = (location.pathname.split("/").pop() || "");
  const isHome = (path === "" || path === "index.html") ? "active" : "";
  const is = (p) => path === p ? "active" : "";

  // Desktop top nav
  const nav = document.querySelector(".nav");
  if (nav) {
    if (user) {
      nav.innerHTML = `
        <a href="index.html" class="${isHome}">Home</a>
        <a href="market.html" class="${is('market.html')}">Market</a>
        <a href="trade.html" class="${is('trade.html')}">Trade</a>
        <a href="wallet.html" class="${is('wallet.html')}">Assets</a>
        <span class="user-chip">👤 ${user.name}</span>
        <a href="#" id="logoutBtn" class="btn-signup">Log Out</a>`;
      document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        cbClearSession();
        location.href = "index.html";
      });
    } else {
      nav.innerHTML = `
        <a href="index.html" class="${isHome}">Home</a>
        <a href="market.html" class="${is('market.html')}">Market</a>
        <a href="trade.html" class="${is('trade.html')}">Trade</a>
        <a href="login.html" class="${is('login.html')}">Log In</a>
        <a href="signup.html" class="btn-signup ${is('signup.html')}">Sign Up</a>`;
    }
  }

  // Mobile topbar user area
  const topbar = document.querySelector(".topbar");
  if (topbar) {
    let userArea = document.getElementById("topbarUser");
    if (!userArea) {
      userArea = document.createElement("div");
      userArea.id = "topbarUser";
      userArea.className = "topbar-user";
      topbar.appendChild(userArea);
    }
    if (user) {
      userArea.innerHTML = `
        <span class="user-chip">👤 ${user.name}</span>
        <a href="#" id="logoutBtnMobile" class="btn-signup">Log Out</a>`;
      document.getElementById("logoutBtnMobile").addEventListener("click", (e) => {
        e.preventDefault();
        cbClearSession();
        location.href = "index.html";
      });
    } else {
      userArea.innerHTML = `
        <a href="login.html" class="btn-signup" style="background:#1a1f27;color:#eaecef !important">Log In</a>
        <a href="signup.html" class="btn-signup">Sign Up</a>`;
    }
  }

  // Bottom nav (mobile only)
  let bn = document.querySelector(".bottom-nav");
  if (!bn) {
    bn = document.createElement("nav");
    bn.className = "bottom-nav";
    document.body.appendChild(bn);
  }
  bn.innerHTML = `
    <a href="index.html" class="bn-item ${isHome}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span>Home</span>
    </a>
    <a href="market.html" class="bn-item ${is('market.html')}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
      <span>Market</span>
    </a>
    <a href="trade.html" class="bn-item ${is('trade.html')}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
      <span>Trade</span>
    </a>
    <a href="wallet.html" class="bn-item ${is('wallet.html')}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
      <span>Assets</span>
    </a>`;
}
