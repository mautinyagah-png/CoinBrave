// CoinBrave shared auth helpers (localStorage prototype)
const CB_USERS_KEY     = "cb_users";
const CB_SESSION_KEY   = "cb_session";
const CB_WALLET_PREFIX = "cb_wallet_";

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

function cbRenderNav() {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const user = cbCurrentUser();
  const path = (location.pathname.split("/").pop() || "index.html");
  const is = (p) => path === p ? "active" : "";
  const isMarkets = (path === "" || path === "index.html") ? "active" : "";

  if (user) {
    nav.innerHTML = `
      <a href="index.html" class="${isMarkets}">Markets</a>
      <a href="trade.html" class="${is('trade.html')}">Trade</a>
      <a href="wallet.html" class="${is('wallet.html')}">Wallet</a>
      <span class="user-chip">👤 ${user.name}</span>
      <a href="#" id="logoutBtn" class="btn-signup">Log Out</a>`;
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      cbClearSession();
      location.href = "index.html";
    });
  } else {
    nav.innerHTML = `
      <a href="index.html" class="${isMarkets}">Markets</a>
      <a href="trade.html" class="${is('trade.html')}">Trade</a>
      <a href="login.html" class="${is('login.html')}">Log In</a>
      <a href="signup.html" class="btn-signup ${is('signup.html')}">Sign Up</a>`;
  }
}

function cbRequireAuth() {
  if (!cbCurrentUser()) {
    location.href = "login.html";
    return false;
  }
  return true;
}
